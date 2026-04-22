# AutoCore API Modules

New PostgreSQL-backed features should be added here and exposed under `/api/v1`.

Planned modules:

- `auth`: registration, login, admin login, token refresh, logout, role-based access
- `users`: customer/admin profile data
- `catalog`: categories, brands, models, engines, products, images, inventory, compatibility mapping
- `cart`: persistent customer cart
- `wishlist`: saved products
- `orders`: checkout, order items, order status
- `payments`: provider sessions, verification, webhooks
- `reviews`: product reviews and rating aggregates
- `admin`: inventory, orders, analytics, moderation
- `health`: API and database health checks
