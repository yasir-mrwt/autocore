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
DELIVERY_CONFIRMATION_SECRET="replace-with-a-long-random-string"
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
EMAIL_FROM=""
EMAIL_FROM_NAME="AutoCore"
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
npm test
```

Expected result: frontend production build succeeds, Prisma schema validates, and the backend smoke test passes.

The current automated test coverage is intentionally small: it verifies the server app imports without binding a port and the Node 26-safe token helper signs, verifies, and rejects tampered tokens.

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
10. Click checkout and submit valid shipping details.
11. Confirm a success toast says the order/product can be viewed in the Recent tab.
12. Add another product to the cart and click checkout again.
13. Confirm the saved shipping details are shown before the form.
14. Click Edit, change a field, and create the order.

Expected result: cart and wishlist update without reload, the first checkout saves the customer's default shipping details, later checkouts reuse those details, edited details persist, orders are created with `PENDING_PAYMENT`, and invalid stock quantities are rejected.

Validation check:

1. Open the checkout form.
2. Leave required fields empty or enter invalid phone/postal data.
3. Try to create the order.

Expected result: each invalid field shows its own inline message and the backend does not create the order.

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
9. Confirm the dispatch email is sent when SMTP is configured.
10. Ship the order with a courier selected from the Pakistan courier dropdown and a tracking number.
11. Confirm the shipped email is sent.
12. Set or wait for the expected delivery time.
13. Confirm the backend sends the delivery confirmation email automatically after the due time.
14. Open the confirmation link from the email.
15. Return to admin orders and verify the parcel shows as confirmed and successful.

Expected result: protected admin routes reject customer sessions, product changes persist in PostgreSQL, Pakistan courier validation is enforced, order timeline events are created for lifecycle changes, and the order is marked delivered only after the customer confirms the delivery link.

Delivery confirmation route:

```txt
Frontend: /delivery-confirmation?token=SIGNED_TOKEN_FROM_EMAIL
API: POST /api/v1/commerce/delivery-confirmation/confirm
```

Scheduler note: the API process checks due shipped orders every 10 minutes after startup. For manual QA, use a near delivery date/time or call the same controller from a temporary script in a test environment.

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
- Email error: check SMTP variables and `EMAIL_FROM`.
- Delivery confirmation email missing: check SMTP variables, `CLIENT_URL`, `DELIVERY_CONFIRMATION_SECRET`, order status, and `deliveryConfirmationDueAt`.
- Admin courier error: select one of the Pakistan courier dropdown values instead of typing a custom courier.
- Node 26 auth crash: verify `jsonwebtoken` is not installed in the server dependency tree.
