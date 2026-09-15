# AutoCore API Modules

PostgreSQL-backed Express modules are exposed under `/api/v1`.

## Active Modules

- `auth`: customer registration/login, admin login, refresh cookies, logout, profile lookup, password reset, role isolation.
- `catalog`: categories, brands, models, engines, products, images, inventory, compatibility mapping, and public filters.
- `commerce`: cart, wishlist, order creation, saved default shipping address, Stripe checkout, Stripe webhook handling, admin order lifecycle, courier validation, order emails, and delivery confirmation.
- `media`: Cloudinary product image upload and deletion helpers for admin catalog work.
- `reviews`: product review creation and rating aggregates.
- `health`: API liveness and database connectivity checks.

## Commerce Flow Notes

- `POST /commerce/orders` creates an order from the authenticated customer's cart and saves valid shipping details to the customer's default address.
- `/auth/me` returns the default shipping address so the frontend can show saved checkout details on the next purchase.
- Admin dispatch uses `POST /commerce/admin/orders/:orderId/prepare-dispatch` and sends a dispatch email when SMTP is configured.
- Admin shipping uses `POST /commerce/admin/orders/:orderId/ship`, validates the courier against the Pakistan courier list, sends a shipped email, and records when delivery confirmation should be requested.
- The API process runs `sendDueDeliveryConfirmations` on a timer after startup and sends confirmation links for due shipped orders.
- `POST /commerce/delivery-confirmation/confirm` is public because customers reach it from email links. The signed token identifies the order and prevents arbitrary confirmation.

## Production Notes

- Keep business rules in these modules instead of duplicating them in the client.
- Use `DELIVERY_CONFIRMATION_SECRET` for email confirmation tokens and keep it stable while outstanding confirmation emails exist.
- In multi-instance production, run delivery confirmation reminders from one scheduler or worker instead of every API instance.

## Docker Notes

- Docker Compose runs PostgreSQL as service `db` on internal port `5432`.
- The backend must use `DATABASE_URL=postgresql://...@db:5432/...` inside Compose.
- Host tools can connect through configurable `DB_PORT`, default `15432`.
- Startup uses `prisma generate` and `prisma migrate deploy`; it applies existing migrations and does not reset data.
- Admin and catalog seed scripts remain manual: run them with `docker compose exec backend npm run seed:admin` or `docker compose exec backend npm run seed:catalog`.

## Netlify Notes

- `server/netlify/functions/api.js` imports the existing Express app for REST API requests.
- `server/netlify/functions/delivery-confirmations.js` runs the existing delivery email worker on Netlify's schedule.
- Stripe webhooks continue to use the Express raw-body route at `/api/v1/commerce/stripe/webhook`.
- Netlify production requires a managed PostgreSQL `DATABASE_URL`; keep Docker PostgreSQL for local development.
