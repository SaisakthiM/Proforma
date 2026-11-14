# PROFORMA — Let's Break the Stereotype, Let's Farmline

A complete, production-shaped agricultural supply marketplace: verified seeds,
machinery, tools and soils, matched to a farmer's soil, climate and crops.

- **Storefront** — React 18 + Vite, paper/forest/gold registry aesthetic.
- **API** — Spring Boot 3.3 / Java 21, stateless JWT, JPA + Postgres.
- **Mobile** — Expo SDK 54 app, demo and production listings.
- **Edge** — nginx image serving the built SPA and proxying `/api` and `/media`.
- **Infrastructure** — Terraform (Docker provider) under `environment/prod`.

The application lives in three independent repositories; this repository holds the
infrastructure and the shared runbook:

| Repository | Contains | Pipeline |
| --- | --- | --- |
| `proforma-web` | Vite storefront, nginx deploy image | `.github/workflows/ci.yml` builds; `deploy.yml` ships to Vercel |
| `proforma-api` | Spring Boot API, Dockerfile | `.github/workflows/ci.yml` runs Maven verify; `deploy.yml` ships to Railway |
| `proforma-mobile` | Expo app, demo/production variants | `ci.yml` type-checks; `android-release.yml` builds/submits; `ota-update.yml` pushes OTA |

The deploy workflows no-op until their repository secrets exist, so builds stay green
before the hosting accounts are wired.

Only the gateway publishes a host port. Postgres and the API stay on a private
Docker network and persist through named volumes.

---

## Repository layout

```
C:\Qoder\
├── Proforma/                  this repository: infrastructure + runbook
│   └── environment/
│       └── prod/              Terraform stack (network, volumes, 3 containers)
├── proforma-web/              React storefront + seller studio + nginx deploy image
├── proforma-api/              Spring Boot API, seed data, uploads
└── proforma-mobile/           Expo app
```

`terraform apply` builds the API and storefront from the sibling checkouts. Keep the
three repositories side by side, or pass `-var "api_source_dir=..."` and
`-var "web_source_dir=..."`.

## Deploy the demo

Prerequisites: Docker Engine/Desktop running, Terraform ≥ 1.5, and the `proforma-api`
and `proforma-web` repositories checked out as siblings of this one.

```bash
cd environment/prod
cp terraform.tfvars.example terraform.tfvars   # optional; edit secrets for real use
terraform init
terraform apply
```

Open **http://localhost:8080**.

On the first boot the gateway can show the branded 503 notice for a minute or
two while Spring Boot creates the schema and seeds the catalog. Reload once the
API health check turns healthy (`docker ps` shows `proforma-prod-api` healthy).

What Terraform creates:

| Resource | Name | Notes |
| --- | --- | --- |
| Network | `proforma-prod-net` | bridge, DNS aliases `db`, `backend`, `gateway` |
| Volume | `proforma-prod-pgdata` | Postgres data |
| Volume | `proforma-prod-uploads` | seller product images (`/media/*`) |
| Container | `proforma-prod-db` | `postgres:16-alpine`, internal only |
| Container | `proforma-prod-api` | built from `proforma-api`, internal only |
| Container | `proforma-prod-gateway` | built from `proforma-web`, publishes `:8080` |

The images rebuild automatically when web/API source changes (content hashes feed
`docker_image.triggers`). The first apply compiles Maven and Vite inside Docker, so
expect a few minutes.

Useful commands:

```bash
terraform output                       # URLs, container/volume names, demo logins
terraform apply -var "http_port=9090"  # serve on another host port
docker logs -f proforma-prod-api
docker logs -f proforma-prod-gateway
terraform destroy                      # removes containers, network and volumes
```

`terraform destroy` deletes the database and uploads volumes with the rest of the
stack, so the next apply starts from a clean seed. If a destroy is interrupted,
remove the leftovers explicitly:

```bash
docker volume rm proforma-prod-pgdata proforma-prod-uploads
```

## Demo accounts

Password for every seeded user: `Proforma@123`

| Role | Email |
| --- | --- |
| Buyer | `ravi@proforma.dev` |
| Seller | `seller.kaveri@proforma.dev` |

The login page also exposes one-click demo logins. Registration is a real flow:
account → role (buyer or seller) → farm profile (farmer type, crops, state,
district, climate, irrigation, farm size) or seller business profile.

## Payments are simulated

Checkout intentionally mimics a Stripe-style card/UPI/net-banking UI, but **no
bank account, card network or PSP is connected**. Card, UPI and bank fields are
validated and formatted in the browser only; they are never sent anywhere.
The API receives just `paymentMethod` and `paymentLabel`, and returns a fake
reference such as `PF-4F7K2A9C`. Do not enter real payment credentials.

## Seed data

On first startup against an empty database the API seeds:

- 8 users — 4 buyers with farm profiles and 4 seller businesses.
- 40 listed products — 10 each across seeds, machinery, tools and soils, with
  realistic varieties, pricing, stock, tags, ratings and engraving-style art.
- Reviews from buyers, and six months of orders and view/cart events so the
  seller analytics and recommendation engine have history to work with.

Seeding is idempotent: it is skipped whenever products already exist. Disable it
with `seed_database = false` in `terraform.tfvars`.

## Feature map

**Storefront**

- Amazon-style home: search, department nav, offers rail, featured products,
  category tiles, trust and seller bands.
- Search/catalog with query, category, price, rating, sort and pagination.
- Product detail: gallery, facts, seller, add-to-cart, buy now, review summary
  and form, and analytics-driven recommendations.
- Cart, demo checkout (card / UPI / net banking), order confirmation timeline.
- Account page: farm profile, seller profile, order register.
- About page with demo statistics and seller standards.
- Branded 404 and 503 pages, plus a React error boundary.

**Auth & recommendations**

- Custom 3-step registration with farmer/seller onboarding.
- Farm-profile, co-view, category-affinity and quality signals feed
  `/api/recommendations/me` and `/api/recommendations/product/{id}`.
- Events (`VIEW`, `CART`) are recorded anonymously so recommendations improve
  from the first visit.

**Seller studio** (`/seller`)

- Overview KPIs, six-month revenue chart, recent orders and top products.
- Listings table with search, category/status/stock filters and edit links.
- Create/edit listing with image upload (≤ 6 MB) or URL, pricing, stock,
  location, tags, draft/paused/featured states.
- Orders with dispatch status updates (`PAID → PACKED → SHIPPED → DELIVERED`,
  or `CANCELLED`).
- Analytics: views, carts, orders, conversion, revenue, category mix, top
  products, buyer regions and a conversion funnel.

## API surface

Public reads:

```
GET  /api/products?q=&category=&minPrice=&maxPrice=&minRating=&sort=&page=&size=
GET  /api/products/featured
GET  /api/products/{id}
GET  /api/products/{id}/reviews
GET  /api/meta/categories | /offers | /stats
GET  /api/recommendations/product/{id}
GET  /api/recommendations/me        (personalised when a JWT is present)
POST /api/events                    (anonymous VIEW/CART signals)
```

Authenticated:

```
POST /api/auth/register | /login
GET  /api/auth/me
POST /api/products/{id}/reviews
POST /api/orders
GET  /api/orders/mine
```

Seller only (`ROLE_SELLER`): `/api/seller/overview`, `/analytics`, `/products`,
`/products/{id}`, `/orders`, `/orders/{id}/status`, `/uploads`.

Errors are JSON `{ "message": ..., "fields": {...} }`; unhandled failures return
the branded 503 page through nginx.

## Local development (optional)

The same schema is used locally; only the datasource URL differs.

```bash
# API (Java 21 + Maven), with Postgres on localhost:5432
cd ../proforma-api
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/proforma \
SPRING_DATASOURCE_USERNAME=proforma \
SPRING_DATASOURCE_PASSWORD=proforma \
mvn spring-boot:run

# Storefront, proxying /api and /media to :8080
cd ../proforma-web
npm install
npm run dev            # http://localhost:5173
```

Environment overrides accepted by the API: `SPRING_DATASOURCE_*`,
`APP_JWT_SECRET`, `APP_JWT_TTL_DAYS`, `APP_CORS_ORIGINS`, `APP_UPLOADS_DIR`,
`APP_SEED_ENABLED`.

## Deploy to production (Vercel + Railway + Supabase + Cloudflare)

Production is split by hostname:

| Hostname | Serves | Host |
| --- | --- | --- |
| `proforma.dpdns.org` | storefront (static Vite build) | Vercel |
| `api.proforma.dpdns.org` | `/api/**` JSON API | Railway |
| — | PostgreSQL | Supabase |

Cloudflare is DNS, TLS and WAF in front of those hostnames. The tunnel in
`environment/local/cloudflared.example.yml` is only for exposing local dev servers; production does
not use it.

### 1. Supabase (database)

Create a project in the region closest to your users, then copy the **session-mode pooler**
connection string: `aws-<region>.pooler.supabase.com`, port `5432`, user `postgres.<project-ref>`.
Do not use transaction mode (`6543`) with Hibernate — it breaks prepared statements.

Hibernate `ddl-auto: update` creates the schema on first boot. Boot once with
`APP_SEED_ENABLED=true` to load the sample catalogue, then set it to `false`. Move to Flyway plus
`validate` before storing real customer data.

### 2. Railway (API)

Create a service from the **`proforma-api`** repository. The repository root is the build
context and Railway detects the `Dockerfile` there. Add the repository secret
`RAILWAY_TOKEN` and the variable `RAILWAY_SERVICE` (the workflow defaults to `proforma-api`)
so `.github/workflows/deploy.yml` can deploy on every push to `main`. Set:

| Variable | Value |
| --- | --- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<pooler-host>:5432/postgres?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `postgres.<project-ref>` |
| `SPRING_DATASOURCE_PASSWORD` | Supabase database password |
| `APP_JWT_SECRET` | 32+ random bytes |
| `APP_CORS_ORIGINS` | `https://proforma.dpdns.org` |
| `APP_UPLOADS_DIR` | `/data/uploads` (with a Railway volume mounted at `/data`) |
| `APP_SEED_ENABLED` | `true` for the first boot, then `false` |

`server.port` now reads `PORT`, which Railway injects. Add the custom domain
`api.proforma.dpdns.org` in Railway and copy the CNAME target it shows.

### 3. Vercel (storefront)

Import the **`proforma-web`** repository and leave **Root Directory** at the repository root.
Add `VITE_API_URL=https://api.proforma.dpdns.org`. `vercel.json` supplies the SPA rewrite (so
`/privacy` works on a hard refresh) and basic security headers. Add the domain
`proforma.dpdns.org`. For CLI deploys from Actions, add the repository secrets
`VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`; without them the deploy job skips.

Leave `VITE_PAYMENTS` unset while checkout is simulated; set it to `razorpay` when the live
checkout ships, and the footer disclosure switches with it.

### 4. Cloudflare DNS

In the `proforma.dpdns.org` zone:

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| CNAME | `@` | `cname.vercel-dns.com` | Proxied |
| CNAME | `api` | Railway target | DNS only at first |

Set SSL/TLS mode to **Full (strict)**; "Flexible" causes redirect loops. Keep `api` DNS-only until
Railway has issued its certificate, then turn the proxy on if you want Cloudflare in front of the
API as well.

Set up Cloudflare Email Routing so `privacy@proforma.dpdns.org` forwards to a mailbox you read — it
is the contact in the privacy policy and the Amazon listing.

### 5. Verify

```bash
curl -s https://api.proforma.dpdns.org/actuator/health
curl -sI https://proforma.dpdns.org/privacy
```

Privacy policy URL for the store listing: `https://proforma.dpdns.org/privacy`.

### 6. Before going public

- Rotate `postgres_password` and `jwt_secret` from `environment/prod/terraform.tfvars`; they are
  committed to the repository.
- Seller uploads currently land on the container filesystem. Attach a Railway volume now, or move
  uploads to Supabase Storage before onboarding real sellers.

## Operations notes

- **Health** — nginx `GET /healthz`; API `GET /actuator/health` (network-only).
- **Logs** — `docker logs`; Hibernate SQL logging is suppressed by default.
- **Uploads** — stored in the `uploads` volume and served by the API under
  `/media/...`, proxied and cached for 7 days by nginx.
- **State** — Terraform state is local by design. Replace the `backend "local"`
  block in `environment/prod/versions.tf` before sharing the stack.
- **Secrets** — demo defaults exist so `terraform apply` works untouched. Change
  `postgres_password` and `jwt_secret` in `terraform.tfvars` for any real host.
- **HTTP** — the gateway listens on plain HTTP. Terminate TLS in front of it
  (load balancer, Caddy, Cloudflare) for a public deployment.