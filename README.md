# AutoCore

AutoCore is a full-stack auto spare parts commerce project. It includes a React storefront, customer cart and wishlist flows, Stripe checkout, order tracking, product reviews, and an admin panel for catalog and order lifecycle management.

## Project Structure

```txt
carspareparts/
  client/   React + Vite frontend
  server/   Node.js + Express + Prisma API
```

## Requirements

- Node.js 26.0.0 or newer in the Node 26 line
- npm
- PostgreSQL database, local or hosted by Supabase
- Stripe test account for checkout testing
- Optional Cloudinary account for admin image uploads
- Optional SMTP account for password reset and delivery emails

## Install

From the project root:

```bash
npm --prefix client install
npm --prefix server install
```

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
```

The server currently has no automated test suite. Use `TESTING_FLOW.md` for manual QA coverage.

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

## Node 26 Compatibility

The backend no longer uses `jsonwebtoken` because its transitive dependency chain loads `buffer.SlowBuffer`, which is removed in Node.js 26. Access tokens are now signed and verified with Node's built-in `crypto` module using HS256, so the active runtime path does not depend on the removed API.

## Troubleshooting

- `DATABASE_URL or DIRECT_URL is required`: set `DATABASE_URL` in `server/.env`.
- `ACCESS_TOKEN_SECRET is required`: set a long random value in `server/.env`.
- `Stripe is not configured`: set `STRIPE_SECRET_KEY` before testing checkout.
- `Cloudinary is not configured`: set Cloudinary variables before uploading admin product images.
- `SMTP is not configured`: set SMTP variables before password reset or delivery confirmation email tests.
- CORS failures: make sure `CLIENT_ORIGIN` includes the frontend origin exactly.
- Empty catalog: run migrations and import/seed catalog data.

## Production Handover Notes

- Configure production PostgreSQL, Stripe, Cloudinary, and SMTP secrets.
- Add automated tests for auth, cart, checkout, order lifecycle, catalog CRUD, and admin actions.
- Add inventory reservation or transaction-level stock checks before high-traffic production checkout.
- Add scheduled delivery-confirmation email jobs if reminders must be automatic.
