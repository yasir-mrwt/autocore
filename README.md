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
- Optional SMTP account for password reset, dispatch, shipped, and delivery confirmation emails

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

## Node 26 Compatibility

The backend no longer uses `jsonwebtoken` because its transitive dependency chain loads `buffer.SlowBuffer`, which is removed in Node.js 26. Access tokens are now signed and verified with Node's built-in `crypto` module using HS256, so the active runtime path does not depend on the removed API.

## Delivery Email Notes

Delivery emails require SMTP variables in `server/.env`. `CLIENT_URL` must point to the frontend URL because confirmation links are built as `/delivery-confirmation?token=...`. `DELIVERY_CONFIRMATION_SECRET` is recommended for signed confirmation links; when absent, the backend falls back to the access or refresh token secret.

The in-process scheduler is enough for local testing and simple deployments. For multi-instance production, move `sendDueDeliveryConfirmations` to one external worker or cron process so duplicate reminder emails are not sent by multiple API instances.

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
- Add automated tests for auth, cart, checkout, order lifecycle, catalog CRUD, and admin actions.
- Add inventory reservation or transaction-level stock checks before high-traffic production checkout.
- Move delivery-confirmation reminders to a single production scheduler/worker when running more than one API instance.
