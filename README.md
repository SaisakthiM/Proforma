# PROFORMA — Unit of Idea 2 Impact

A complete, production-shaped agricultural supply marketplace: verified seeds,
machinery, tools and soils, matched to a farmer's soil, climate and crops.

- **Storefront** — React 18 + Vite, paper/forest/gold registry aesthetic.
- **API** — Spring Boot 3.3 / Java 21, stateless JWT, JPA + Postgres.
- **Edge** — nginx gateway serving the built SPA and proxying `/api` and `/media`.
- **Infrastructure** — Terraform (Docker provider) under `environment/prod`.

Only the gateway publishes a host port. Postgres and the API stay on a private
Docker network and persist through named volumes.

---

## Repository layout

```
.
├── environment/
│   └── prod/                  Terraform stack (network, volumes, 3 containers)
├── projects/
│   ├── backend/               Spring Boot API, seed data, uploads
│   ├── frontend/              React storefront + seller studio
│   └── gateway/               nginx config and branded 404/503 pages
├── .dockerignore
├── .gitignore
└── README.md
```

## Deploy the demo

Prerequisites: Docker Engine/Desktop running, Terraform ≥ 1.5.

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
| Container | `proforma-prod-api` | built from `projects/backend`, internal only |
| Container | `proforma-prod-gateway` | built from `projects/gateway`, publishes `:8080` |

The images rebuild automatically when frontend/backend/gateway source changes
(content hashes feed `docker_image.triggers`). The first apply compiles
Maven and Vite inside Docker, so expect a few minutes.

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
cd projects/backend
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/proforma \
SPRING_DATASOURCE_USERNAME=proforma \
SPRING_DATASOURCE_PASSWORD=proforma \
mvn spring-boot:run

# Storefront, proxying /api and /media to :8080
cd projects/frontend
npm install
npm run dev            # http://localhost:5173
```

Environment overrides accepted by the API: `SPRING_DATASOURCE_*`,
`APP_JWT_SECRET`, `APP_JWT_TTL_DAYS`, `APP_CORS_ORIGINS`, `APP_UPLOADS_DIR`,
`APP_SEED_ENABLED`.

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