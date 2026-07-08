# AutoCore Testing Flow

Use this checklist to verify the project after setup or before handoff.

## 1. Setup

Install dependencies:

```bash
npm --prefix client install
npm --prefix server install
```

Create env files:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Required backend values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
ACCESS_TOKEN_SECRET="replace-with-a-long-random-string"
CLIENT_URL="http://localhost:5173"
CLIENT_ORIGIN="http://localhost:5173,http://localhost:5174"
ADMIN_EMAIL="admin@autocore.local"
ADMIN_PASSWORD="change-this-admin-password"
```

Optional values for feature-specific tests:

```env
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
SMTP_HOST=""
SMTP_USER=""
SMTP_PASS=""
```

## 2. Database

Validate Prisma:

```bash
npm run db:validate
```

Run migrations from the server:

```bash
npm --prefix server run prisma:migrate
```

Seed the admin user:

```bash
npm --prefix server run seed:admin
```

Import catalog data if you have the generated JSON file:

```bash
npm --prefix server run import:auto-parts -- "/path/to/auto_parts_seed_data.json"
```

Expected result: Prisma validates, migrations apply, admin user exists, and the shop has products.

## 3. Start The App

Start both apps:

```bash
npm run dev
```

Expected result:

- API listens on `http://localhost:8000`.
- Frontend listens on `http://localhost:5173` or the next Vite port.
- `GET http://localhost:8000/api/v1/health` returns status `ok`.
- `GET http://localhost:8000/api/v1/health/db` returns database `connected`.

## 4. Automated Checks

Run:

```bash
npm run build
npm run db:validate
```

Expected result: frontend production build succeeds and Prisma schema validates.

There is currently no automated test suite in the server or client package.

## 5. Customer Flow

1. Open `http://localhost:5173`.
2. Register a customer from `/sign-up`.
3. Confirm the user is logged in and navbar state updates.
4. Open `/shop`.
5. Search or filter products.
6. Open a product detail page.
7. Add the product to wishlist.
8. Add the product to cart.
9. Open cart and adjust quantity.
10. Create an order with a valid shipping address.

Expected result: cart and wishlist update without reload, order is created with `PENDING_PAYMENT`, and invalid stock quantities are rejected.

## 6. Stripe Checkout Flow

Requires `STRIPE_SECRET_KEY`.

1. Create an order from the cart.
2. Click checkout.
3. Pay with Stripe test card `4242 4242 4242 4242`.
4. Use any future expiry and any CVC.
5. Return to the frontend.

Expected result: order payment changes to `SUCCEEDED`, status changes to `PAID`, cart clears, and stock is decremented.

Webhook test:

```bash
stripe listen --forward-to localhost:8000/api/v1/commerce/stripe/webhook
```

Expected result: `checkout.session.completed` updates the matching order.

## 7. Admin Flow

1. Open `/admin/login`.
2. Login with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
3. Open admin overview.
4. Open products and create a product.
5. Edit the product price, image, stock, and status.
6. Archive the product.
7. Open orders.
8. Prepare a paid order for dispatch.
9. Ship the order with courier details.
10. Send delivery confirmation if SMTP is configured.
11. Mark the order delivered.

Expected result: protected admin routes reject customer sessions, product changes persist in PostgreSQL, and order timeline events are created for lifecycle changes.

## 8. Auth And Session Checks

Customer:

- Login at `/sign-in`.
- Refresh the page.
- Open profile.
- Change password.
- Confirm the user is sent back to sign in.

Admin:

- Login at `/admin/login`.
- Refresh the page.
- Confirm admin pages remain accessible.
- Logout and confirm protected admin routes redirect.

Expected result: customer and admin sessions remain separate, and refresh cookies work for the correct role only.

## 9. Common Failure Checks

- 401 on protected routes: check the access token and refresh cookie flow.
- CORS error: add the frontend origin to `CLIENT_ORIGIN`.
- Empty shop: run migrations and import catalog data.
- Prisma connection error: check `DATABASE_URL`, `DIRECT_URL`, and database allowlist/network access.
- Stripe checkout error: check `STRIPE_SECRET_KEY`, currency, and webhook secret.
- Image upload error: check Cloudinary variables.
- Email error: check SMTP variables.
- Node 26 auth crash: verify `jsonwebtoken` is not installed in the server dependency tree.
