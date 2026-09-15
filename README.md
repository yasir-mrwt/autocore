# AutoCore

AutoCore is a full-stack auto spare parts commerce project. It includes a React storefront, customer cart and wishlist flows, Stripe checkout, order tracking, product reviews, and an admin panel for catalog and order lifecycle management.

## Project Structure

```txt
carspareparts/
  client/   React + Vite frontend
  server/   Node.js + Express + Prisma API
```

## Requirements

- Node.js 24.20.0 LTS or newer in the Node 24 line
- npm
- PostgreSQL database, local or hosted by Supabase
- Stripe test account for checkout testing
- Optional Cloudinary account for admin image uploads
- Optional SMTP account for password reset, dispatch, shipped, and delivery confirmation emails

## Install

From the project root:

```bash
npm --prefix client install
npm --prefix server install
```

## Docker Development

The complete local stack can run with Docker Compose:

```bash
cp .env.example .env
docker compose up --build
```

Default Docker host URLs:

```txt
Frontend: http://localhost:5173
API:      http://localhost:14322/api/v1
Health:   http://localhost:14322/api/v1/health
DB check: http://localhost:14322/api/v1/health/db
Postgres: localhost:15432
```

The internal Docker network is different from browser-facing URLs:

- Backend-to-database uses `db:5432` inside Compose.
- Browser-to-backend uses `http://localhost:14322/api/v1` through `VITE_API_BASE_URL`.
- CORS uses `CLIENT_ORIGIN=http://localhost:5173`.

Docker host ports are configurable in the root `.env` file:

```env
FRONTEND_PORT=5173
BACKEND_PORT=14322
DB_PORT=15432
```

Useful Docker commands:

```bash
docker compose logs -f
docker compose logs -f backend
docker compose exec backend npm run seed:admin
docker compose exec backend npm test
docker compose exec frontend npm run build
docker compose down
docker compose build --no-cache
```

`docker compose down` stops the stack but preserves the `postgres-data` volume. Do not run `docker compose down -v` unless you intentionally want to delete the Docker database data.

The backend container runs `prisma generate` and `prisma migrate deploy` on startup. This applies existing migrations without resetting the database.

Docker uses `node:24.20.0-alpine` for both frontend and backend containers.

## Local Observability With InflowAPM

Start the local InflowAPM app separately, with its dashboard at `http://localhost:3000` and API at `http://localhost:5002`.

Put the backend project key in the ignored root `.env` file:

```env
INFLOWAPM_API_KEY=your_inflowapm_project_api_key
INFLOWAPM_ENDPOINT=http://host.docker.internal:5002
INFLOWAPM_SERVICE=autocore-api
INFLOWAPM_ENVIRONMENT=development
```

Then run:

```bash
docker compose up --build
```

Open `http://localhost:5173`, generate normal app requests, and view the project telemetry in InflowAPM. The SDK is server-only and records normalized Express route, HTTP method, status, and duration without request bodies, cookies, authorization headers, or payment secrets.

## Environment

Create local env files from the examples:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Frontend variables:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
```

Backend variables:

```env
NODE_ENV=development
PORT=8000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
ACCESS_TOKEN_SECRET="replace-with-a-long-random-string"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_DAYS=30
DELIVERY_CONFIRMATION_SECRET="replace-with-a-long-random-string"
CLIENT_URL="http://localhost:5173"
CLIENT_ORIGIN="http://localhost:5173,http://localhost:5174"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_CURRENCY="pkr"
```

Do not commit real `.env` files.

## Database

Validate the Prisma schema:

```bash
npm --prefix server run db:validate
```

Run migrations:

```bash
npm --prefix server run prisma:migrate
```

Create the admin account:

```bash
npm --prefix server run seed:admin
```

Import generated auto-parts data when available:

```bash
npm --prefix server run import:auto-parts -- "/path/to/auto_parts_seed_data.json"
```

## Development

Start frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:server
npm run dev:client
```

Default URLs:

```txt
Frontend: http://localhost:5173
API:      http://localhost:8000/api/v1
Health:   http://localhost:8000/api/v1/health
DB check: http://localhost:8000/api/v1/health/db
```

## Build And Validation

```bash
npm run build
npm run db:validate
npm test
```

The current automated coverage is a backend smoke test for app import and token signing/verification. Use `TESTING_FLOW.md` for the full manual QA flow.

## Netlify Deployment

This repo is set up for two Netlify sites without replacing Docker:

- Frontend site: base directory `client`, build command `npm run build`, publish directory `dist`.
- Backend site: base directory `server`, build command `npm run netlify:build`, functions directory `netlify/functions`.

The backend site serves the Express REST API through Netlify Functions using the existing application logic. Its clean API rewrite is:

```txt
/api/* -> /.netlify/functions/api/:splat
```

Set the frontend site's production API variable to the backend site's public API base:

```env
VITE_API_BASE_URL="https://YOUR-BACKEND-SITE.netlify.app/api/v1"
VITE_SOCKET_URL=""
```

Required Netlify environment variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
ACCESS_TOKEN_SECRET="replace-with-a-long-random-string"
DELIVERY_CONFIRMATION_SECRET="replace-with-a-long-random-string"
CLIENT_URL="https://YOUR-FRONTEND-SITE.netlify.app"
CLIENT_ORIGIN="https://YOUR-FRONTEND-SITE.netlify.app"
STRIPE_SECRET_KEY="sk_live_or_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_CURRENCY="pkr"
```

Optional Netlify environment variables:

```env
DIRECT_URL=""
REFRESH_TOKEN_DAYS=30
REFRESH_COOKIE_NAME="autocore_refresh"
AUTH_COOKIE_SAMESITE="lax"
AUTH_COOKIE_SECURE=true
PASSWORD_SALT_ROUNDS=12
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
CLOUDINARY_UPLOAD_FOLDER="autocore/products"
SMTP_HOST=""
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM=""
EMAIL_FROM_NAME="AutoCore"
ADMIN_NAME="AutoCore Admin"
ADMIN_EMAIL="admin@autocore.local"
ADMIN_PASSWORD="change-this-admin-password"
```

Run production migrations against the managed PostgreSQL database before or during a controlled release:

```bash
npm --prefix server run prisma:deploy
```

Netlify Functions are serverless, so the normal Express `app.listen` process and in-process delivery interval do not run there. The Netlify deployment includes a scheduled `delivery-confirmations` function that calls the same `sendDueDeliveryConfirmations` worker every 10 minutes.

## Main API Areas

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/admin/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/catalog/products`
- `GET /api/v1/catalog/products/:idOrSlug`
- `GET /api/v1/commerce/cart`
- `POST /api/v1/commerce/orders`
- `POST /api/v1/commerce/orders/:orderId/checkout-session`
- `GET /api/v1/commerce/admin/orders`
- `POST /api/v1/commerce/admin/orders/:orderId/prepare-dispatch`
- `POST /api/v1/commerce/admin/orders/:orderId/ship`
- `POST /api/v1/commerce/delivery-confirmation/confirm`

## Customer Checkout Flow

- The first checkout asks for the customer's shipping name, phone, street, city, province, postal code, and country.
- Valid checkout details are saved to the customer's default address record and returned in `/api/v1/auth/me`.
- Later checkouts show the saved details first. The customer can continue with them or edit them before creating the next order.
- Invalid checkout fields show inline messages beside the affected inputs.
- After an order is created or a Stripe payment returns successfully, the frontend shows a toast telling the customer the order/product can be viewed in the Recent tab.

## Admin Fulfillment Flow

- Admin users prepare paid orders for dispatch from the orders panel.
- Courier selection is limited to Pakistan courier options in the admin dropdown and API validator.
- Preparing dispatch sends a dispatch email when SMTP is configured.
- Shipping the order requires courier and tracking details, sends a shipped email, and stores a delivery confirmation due date.
- The backend scheduler checks due shipped orders every 10 minutes while the server is running and emails a confirmation link after the expected delivery time.
- When the customer opens the confirmation link, the frontend calls `POST /api/v1/commerce/delivery-confirmation/confirm`; the order is marked delivered, `deliveryConfirmedAt` is saved, and the admin panel shows the order result as successful.

## Stripe Test Flow

1. Add products to the cart.
2. Create an order.
3. Continue to Stripe checkout.
4. Use card `4242 4242 4242 4242`, any future expiry, and any CVC.
5. Return to the shop page and confirm the order is marked paid.

For local webhooks:

```bash
stripe listen --forward-to localhost:8000/api/v1/commerce/stripe/webhook
```

Set the generated value in `STRIPE_WEBHOOK_SECRET`.

Production webhook endpoint for Netlify:

```txt
https://YOUR-BACKEND-SITE.netlify.app/api/v1/commerce/stripe/webhook
```

Stripe secrets stay server-only. Do not expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` as `VITE_` frontend variables.

## CI/CD

GitHub Actions runs the portfolio-safe validation workflow in `.github/workflows/ci.yml` for pull requests targeting `main`, pushes to branches, and manual dispatches.

The workflow checks:

- Frontend: `npm ci`, `npm run lint`, and `npm run build`.
- Backend: `npm ci`, JavaScript syntax checks, `npm run db:validate`, `npm run prisma:generate`, `npm test`, and `npm run netlify:smoke`.

The CI workflow uses dummy local-safe environment values for Prisma generation and smoke tests. It does not connect to production PostgreSQL, Stripe, Supabase, Cloudinary, SMTP, or Netlify, and it does not run production migrations.

Recommended deployment flow:

```txt
feature/fix branch
  -> pull request to main
  -> GitHub Actions CI passes
  -> merge to main
  -> Netlify deploys the frontend and backend sites from main
```

For a solo portfolio project, protect `main` in GitHub so production deploys only happen after CI passes:

- Require a pull request before merging.
- Require status checks before merging.
- Require branches to be up to date before merging.
- Require these checks: `Frontend Checks` and `Backend Checks`.
- Do not allow bypassing the above settings.
- Do not allow force pushes.
- Do not allow deletions.
- Require one approval only if you want a deliberate pause before merging your own PRs; otherwise keep approvals optional for solo work.

## Node Runtime Compatibility

Docker and Netlify are pinned to Node.js 24.20.0 LTS. The backend no longer uses `jsonwebtoken`; access tokens are signed and verified with Node's built-in `crypto` module using HS256, so the app remains compatible with both Node 24 LTS and the newer Node 26 line.

## Delivery Email Notes

Delivery emails require SMTP variables in `server/.env`. `CLIENT_URL` must point to the frontend URL because confirmation links are built as `/delivery-confirmation?token=...`. `DELIVERY_CONFIRMATION_SECRET` is recommended for signed confirmation links; when absent, the backend falls back to the access or refresh token secret.

The in-process scheduler is enough for local testing and simple deployments. For multi-instance production, move `sendDueDeliveryConfirmations` to one external worker or cron process so duplicate reminder emails are not sent by multiple API instances.

On Netlify, the scheduled Function replaces the in-process interval for production delivery confirmation emails.

## Netlify Limits To Know

- Use a managed PostgreSQL database and a pooled connection string when available.
- Netlify Functions are request/response serverless functions, so long-running background work should stay out of normal API requests.
- Large admin image uploads can hit Netlify's function payload limits. Keep upload sizes small or move production uploads to direct-to-Cloudinary browser uploads if large files are required.

## Troubleshooting

- `DATABASE_URL or DIRECT_URL is required`: set `DATABASE_URL` in `server/.env`.
- `ACCESS_TOKEN_SECRET is required`: set a long random value in `server/.env`.
- Delivery confirmation link fails: check `DELIVERY_CONFIRMATION_SECRET`, `CLIENT_URL`, and whether the order is still eligible for confirmation.
- `Stripe is not configured`: set `STRIPE_SECRET_KEY` before testing checkout.
- `Cloudinary is not configured`: set Cloudinary variables before uploading admin product images.
- `SMTP is not configured`: set SMTP variables before password reset or order lifecycle email tests.
- CORS failures: make sure `CLIENT_ORIGIN` includes the frontend origin exactly.
- Empty catalog: run migrations and import/seed catalog data.

## Production Handover Notes

- Configure production PostgreSQL, Stripe, Cloudinary, and SMTP secrets.
- For Netlify, configure `DATABASE_URL`, `CLIENT_URL`, `CLIENT_ORIGIN`, Stripe secrets, and SMTP/Cloudinary variables in the Netlify UI.
- Add automated tests for auth, cart, checkout, order lifecycle, catalog CRUD, and admin actions.
- Add inventory reservation or transaction-level stock checks before high-traffic production checkout.
- Move delivery-confirmation reminders to a single production scheduler/worker when running more than one API instance.
