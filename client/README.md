# AutoCore Frontend

React + Vite frontend for the AutoCore spare parts commerce app.

## Main Flows

- Customer registration, login, profile, wishlist, cart, and recent orders.
- Product browsing with category, brand, model, engine, price, and search filters.
- First-time checkout shipping form with inline validation.
- Saved checkout details shown on later orders, with an edit option before creating the next order.
- Stripe checkout return handling and Recent tab success toast.
- Admin login, catalog management, image upload, order dispatch, courier selection, shipping, and delivery confirmation status.
- Public `/delivery-confirmation` page used by email confirmation links.

## Environment

Create `client/.env` from `client/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
```

`VITE_API_BASE_URL` must point to the Express `/api/v1` base URL. Keep the frontend origin listed in the backend `CLIENT_ORIGIN` value.

## Commands

From the project root:

```bash
npm run dev:client
npm run build
npm run docker:up
```

From `client/`:

```bash
npm run dev
npm run build
npm run lint
```

## Docker Notes

The Compose development service runs Vite on internal port `5173` and exposes it on configurable host port `FRONTEND_PORT`, default `5173`.

Browser-side API calls must use the host URL, not the Docker service name:

```env
VITE_API_BASE_URL=http://localhost:14322/api/v1
VITE_SOCKET_URL=http://localhost:14322
```

The container uses a named `frontend-node-modules` volume so the bind-mounted source does not overwrite installed dependencies.

## Netlify Notes

Netlify builds the frontend with `VITE_API_BASE_URL=/api/v1`, so production browser requests stay same-origin and are rewritten to the Express Netlify Function.

Do not add Stripe secret keys to frontend env variables. Only browser-safe `VITE_` values belong in the client build.

## Handover Checks

- Customer and admin sessions must stay separate; an admin token should not be accepted by customer checkout APIs.
- Checkout should save valid shipping details to the customer's profile and reuse them on the next purchase.
- Invalid checkout fields should show messages beside the fields before submitting.
- `/delivery-confirmation?token=...` should call the backend confirmation endpoint and show a clear success or failure state.
- Admin orders should show courier, tracking, dispatch/shipped dates, delivery confirmation date, and successful/in-progress result.
