# AutoCore

AutoCore is a full-stack auto spare parts e-commerce platform. It includes a customer storefront, product catalog, cart and wishlist overlays, Stripe checkout, order tracking, reviews, and a professional admin panel for order fulfillment and catalog management.

The project is currently demo-ready. Some production items, such as real scraped product imports, production email delivery, scheduled jobs, and automated tests, are listed near the end of this file.

## Project Structure

```txt
carspareparts/
  client/   React + Vite frontend
  server/   Node.js + Express + PostgreSQL API
```

## Main Tech Used

Frontend:
- React 18
- Vite
- React Router
- Redux Toolkit
- Tailwind CSS
- MUI Tooltip
- Lucide React icons
- Axios
- React Toastify
- Stripe frontend SDK

Backend:
- Node.js
- Express.js
- PostgreSQL
- Supabase PostgreSQL compatible setup
- Prisma ORM
- JWT authentication
- bcrypt password hashing
- Stripe checkout and webhook support
- express-validator
- CORS and cookie-based refresh handling

Database:
- PostgreSQL
- Prisma schema and migrations
- Supabase can be used as the hosted PostgreSQL provider

## Features Included

Customer side:
- Home page
- Shop page
- Product details page
- Product image viewer
- Product reviews
- Wishlist overlay
- Cart overlay
- Stripe checkout flow
- User order history and tracking
- Recently viewed products
- Profile overlay
- Profile update
- Password change
- Session handling separated by browser tab

Admin side:
- Admin login
- Separate admin and customer authentication state
- Fixed desktop sidebar
- Mobile collapsible admin sidebar
- Admin dashboard
- Orders table
- Pending orders
- Ready for dispatch
- Shipped orders
- Delivery confirmation page
- Analytics / reports
- Products page
- Product create/update/archive API integration
- Customers page
- Settings page
- Admin activity dropdown
- Order lifecycle actions

Order lifecycle:
- Paid / new order
- Prepare dispatch
- Ready for dispatch
- Add shipment details
- Ship now
- Delivery confirmation pending
- Delivered

## Requirements

Install these before running the project:
- Node.js 18 or newer
- npm
- PostgreSQL database or Supabase project
- Stripe test account if testing payments

## First Time Setup

Open a terminal in the project root:

```bash
cd "carspareparts"
```

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

## Environment Setup

Create a `.env` file inside `server/`.

You can start from:

```bash
server/.env.example
```

Important backend variables:

```env
NODE_ENV=development
PORT=8000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

ACCESS_TOKEN_SECRET="replace-with-a-long-random-string"
REFRESH_TOKEN_SECRET="replace-with-a-long-random-string"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_DAYS=30
REFRESH_COOKIE_NAME="autocore_refresh"
AUTH_COOKIE_SAMESITE="lax"
AUTH_COOKIE_SECURE=false
PASSWORD_SALT_ROUNDS=12

ADMIN_NAME="AutoCore Admin"
ADMIN_EMAIL="admin@autocore.local"
ADMIN_PASSWORD="change-this-admin-password"

CLIENT_URL="http://localhost:5173"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_CURRENCY="pkr"
```

Create a `.env` file inside `client/`.

You can start from:

```bash
client/.env.example
```

Frontend variables:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
```

Do not commit real `.env` files. Commit only `.env.example`.

## Database Setup

From the backend folder:

```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

For local development with a local PostgreSQL database, you can use:

```bash
npx prisma migrate dev
```

To inspect the database visually:

```bash
npm run prisma:studio
```

## Seed Demo Data

Create an admin user:

```bash
cd server
npm run seed:admin
```

Seed catalog data:

```bash
cd server
npm run seed:catalog
```

Make sure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `DATABASE_URL` are set before running seed scripts.

## Running The Project

Start the backend first:

```bash
cd server
npm run dev
```

The backend should run on:

```txt
http://localhost:8000
```

Health check:

```txt
http://localhost:8000/api/v1/health
```

Start the frontend in a second terminal:

```bash
cd client
npm run dev
```

The frontend should run on:

```txt
http://localhost:5173
```

## Useful URLs

Customer:

```txt
http://localhost:5173/
http://localhost:5173/shop
http://localhost:5173/sign-in
http://localhost:5173/sign-up
http://localhost:5173/buyer/watch-list
```

Admin:

```txt
http://localhost:5173/admin/login
http://localhost:5173/admin/overview
http://localhost:5173/admin/orders
http://localhost:5173/admin/products
http://localhost:5173/admin/customers
http://localhost:5173/admin/analytics
http://localhost:5173/admin/settings
```

## Stripe Test Flow

1. Add products to cart.
2. Open cart overlay.
3. Fill checkout/shipping details.
4. Create order.
5. Continue to Stripe checkout.
6. Use Stripe test card:

```txt
4242 4242 4242 4242
Any future expiry
Any CVC
```

For local webhooks:

```bash
stripe listen --forward-to localhost:8000/api/v1/commerce/stripe/webhook
```

Then set the generated webhook secret in:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Authentication Notes

AutoCore uses separate customer and admin sessions.

Customer and admin auth are intentionally separated:
- separate storage keys
- separate refresh cookies
- separate route guards
- separate Redux auth state

Frontend access tokens are stored in `sessionStorage`, not `localStorage`. This means a new browser tab, including a new incognito tab, will not automatically show the user as logged in. Refreshing the same tab keeps the session for that tab.

Password change revokes refresh sessions and sends the user back to sign in.

## Admin Demo Flow

1. Login at `/admin/login`.
2. Open Dashboard and review summary cards.
3. Open Products.
4. Create or manage a product.
5. Open Orders.
6. Prepare dispatch for a paid order.
7. Add courier, tracking number, and delivery estimate.
8. Ship the order.
9. Send delivery confirmation.
10. Mark delivered if needed for demo.

## Customer Demo Flow

1. Browse home page.
2. Open Shop.
3. Filter or search products.
4. Open product detail page.
5. Add to wishlist.
6. Add to cart.
7. Checkout with Stripe test card.
8. Open Activity / Orders.
9. Track order status.
10. Confirm delivery when available.

## Build Check

Frontend production build:

```bash
cd client
npm run build
```

Backend validation:

```bash
cd server
npm run db:validate
```

## What Is Left For Production Handover

The current project is good for a polished demo. These items should be completed before final production handover:

- Real scraped product data import pipeline.
- Persistent product image storage for uploaded images.
- Real email provider for delivery confirmation emails.
- Scheduled job or queue for sending delivery confirmation after 2 days.
- Production Stripe keys.
- Production webhook deployment and payment reconciliation checks.
- Admin notification polling or real-time updates.
- Full mobile and desktop QA pass.
- Checkout, auth, order lifecycle, and deployment QA.
- Final deployment documentation.
- Automated tests for auth, checkout, orders, admin actions, and catalog CRUD.
- Optional email verification flow for changing customer email.



