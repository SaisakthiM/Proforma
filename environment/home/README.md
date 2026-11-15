# Proforma at home — old PC + Cloudflare Tunnel

This stack runs the whole marketplace on one machine: Postgres, the Spring Boot API, the nginx
gateway that serves the built storefront, and a Cloudflare Tunnel container that publishes it on
`proforma.dpdns.org`. Nothing is published to the LAN or the internet except through the tunnel.

It is the low-cost deployment until there is capital for managed hosting. Treat it as a single-node
pilot, not a high-availability service.

## What runs

| Service | Image / build | Reachable from | Volume |
| --- | --- | --- | --- |
| `db` | `postgres:16-alpine` | Docker network only | `proforma-home_pgdata` |
| `backend` | built from `../../../proforma-api` | Docker network only | `proforma-home_uploads` |
| `gateway` | built from `../../../proforma-web`, nginx | host loopback `127.0.0.1:8080` | — |
| `cloudflared` | `cloudflare/cloudflared` | outbound only | — |

The storefront is built with an empty `VITE_API_URL`, so the browser calls `/api` on the same
origin. The gateway proxies `/api` and `/media` to `backend:8080`. Payments stay simulated
(`VITE_PAYMENTS` empty).

## Before the first run

1. Docker Desktop is running, and `proforma-api` + `proforma-web` are checked out next to
   `Proforma` (the build contexts are `../../../proforma-api` and `../../../proforma-web`).
2. In the Cloudflare Zero Trust dashboard, create a tunnel for the `proforma.dpdns.org` zone and add
   a public hostname:

   | Public hostname | Service |
   | --- | --- |
   | `proforma.dpdns.org` | `HTTP` → `gateway:80` |

   Cloudflare creates the DNS record automatically. No `api.` hostname is needed; the API is
   same-origin through the gateway.
3. Copy the tunnel token from the dashboard (or `cloudflared tunnel token <name>`).

## Configure

```bash
cd environment/home
cp .env.example .env
```

Edit `.env`:

- `CLOUDFLARE_TUNNEL_TOKEN` — the tunnel token.
- `POSTGRES_PASSWORD` — a new strong password.
- `JWT_SECRET` — 32+ random bytes, e.g. `openssl rand -hex 32`.
- `PUBLIC_ORIGIN` — keep `https://proforma.dpdns.org` unless the hostname changes.
- `SEED_DATABASE=true` for the first boot only.

Never commit `.env`. It is already covered by the repository `.gitignore`.

## Start

```bash
docker compose up -d --build
docker compose ps
```

The first build compiles Maven and Vite inside Docker, so expect several minutes. The gateway
returns its branded 503 page until the API health check passes.

Verify locally, then through the tunnel:

```bash
curl -s http://127.0.0.1:8080/api/meta/config
curl -s https://proforma.dpdns.org/api/meta/config
docker compose exec backend wget -qO- http://127.0.0.1:8080/actuator/health
```

The gateway proxies `/api` and `/media` only, so `/actuator/*` stays on the Docker network. Use the
`exec` command above (or `docker compose ps`) for API health checks.
After confirming the catalogue seeded, set `SEED_DATABASE=false` and re-run
`docker compose up -d backend` so a later empty database is not silently re-seeded.

## Day-to-day operations

| Task | Command |
| --- | --- |
| Logs, last 200 lines | `docker compose logs --tail=200 backend` |
| Follow gateway/API logs | `docker compose logs -f gateway backend` |
| Restart one service | `docker compose restart backend` |
| Stop everything, keep data | `docker compose down` |
| Stop everything and delete data | `docker compose down -v` |
| Check flags at runtime | `curl -s http://127.0.0.1:8080/api/meta/config` |
| Check API health | `docker compose exec backend wget -qO- http://127.0.0.1:8080/actuator/health` |

Feature switches live in `.env` and are read on boot:

- `CHECKOUT_ENABLED=false` stops new orders (`POST /api/orders` returns 503) while browsing stays up.
- `EVENTS_ENABLED=false` stops view/cart event writes.
- `SELLER_SIGNUP_ENABLED=false` pauses new seller registrations.

`docker compose down -v` destroys the database and uploads. Export a backup first.

## Update and roll back

```bash
# in each application repo
git pull
docker compose up -d --build backend gateway
docker compose ps
docker compose exec backend wget -qO- http://127.0.0.1:8080/actuator/health
```

The API uses `ddl-auto: update`, so a deploy that adds columns normally applies them on boot. A
deploy that removes or renames columns leaves them behind. Before pulling a risky change:

1. Run a database backup (below).
2. Record the previous commit of `proforma-api` / `proforma-web`.
3. Roll back with `git checkout <previous-commit>` in the affected repo, then
   `docker compose up -d --build backend gateway`.
4. If the schema was damaged, restore the SQL dump before starting the backend again.

Uploads live on their own volume, so rebuilding containers does not touch seller images.

## Backups

Backups are one-off Compose services, so they work in PowerShell, cmd and Git Bash.

```bash
# database -> environment/home/backups/proforma-YYYYmmdd-HHMMSS.sql.gz
docker compose --profile tools run --rm backup

# seller uploads -> environment/home/backups/uploads-YYYYmmdd-HHMMSS.tar.gz
docker compose --profile tools run --rm backup-uploads
```

Copy `backups/` to another disk or cloud drive after each run. Restoring:

```bash
# database
gunzip -c backups/proforma-YYYYmmdd-HHMMSS.sql.gz | docker compose exec -T db psql -U proforma -d proforma

# uploads (PowerShell; adjust the filename)
docker run --rm -v proforma-home_uploads:/data -v "${PWD}\backups:/backup" alpine sh -c "cd /data && tar xzf /backup/uploads-YYYYmmdd-HHMMSS.tar.gz"
```

Do one real restore into an empty environment before trusting the process.

Schedule the database backup with Windows Task Scheduler, for example daily at 02:00:

```powershell
schtasks /Create /SC DAILY /ST 02:00 /TN "Proforma backup" /TR "cmd /c cd /d C:\Qoder\Proforma\environment\home && docker compose --profile tools run --rm backup"
```

## Keeping the old PC healthy

- Disable sleep and hibernation; if the PC sleeps, the tunnel and storefront go offline.
- Start Docker Desktop at login, and set containers to `restart: unless-stopped` (already set).
- Keep at least 20 GB free. Logs are capped at 3 × 10 MB per container; backups grow with the
  database.
- Prefer wired ethernet. Home upload bandwidth is the ceiling for page loads once images grow.
- Watch `docker stats`; the JVM is capped at 75% of available RAM by the image entrypoint. If the
  machine has 8 GB, budget roughly 1 GB for Postgres and 2–3 GB for the API during a build.
- `DB_POOL_SIZE=8` is matched to Hikari's timeout in `application.yml`. Do not raise it past the
  Postgres `max_connections` headroom on this machine.

## Security checklist

- Rotate the demo `postgres_password` and `jwt_secret` that are committed under
  `environment/prod/terraform.tfvars`; this stack uses different values from `.env`.
- Keep `WEB_PORT` bound to `127.0.0.1`. Do not change it to `0.0.0.0`; the tunnel does not need a
  host port.
- Tunnel token, database password and JWT secret live only in `.env` on this machine.
- Cloudflare terminates TLS. Enable **Always Use HTTPS** and a WAF rate-limit rule on
  `/api/auth/*` in the Cloudflare dashboard.
- This is still a demo: checkout is simulated, no gateway receives credentials, and seller
  identities are self-declared. Do not take real payments until the payment, KYC and refund work in
  the risk register is done.

## Leaving the PC behind

When there is capital, move in this order: database + uploads to managed Postgres and object
storage, then the API and gateway to a managed container host, then enable Flyway migrations before
accepting real customer data. The environment variables in `.env` map one-to-one to the Railway and
Vercel settings described in the root README.
