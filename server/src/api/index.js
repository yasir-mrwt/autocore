const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const catalogRoutes = require("../modules/catalog/catalog.routes");
const commerceRoutes = require("../modules/commerce/commerce.routes");
const healthRoutes = require("../modules/health/health.routes");
const mediaRoutes = require("../modules/media/media.routes");
const reviewRoutes = require("../modules/reviews/review.routes");
const { inflowApmMiddleware } = require("../config/inflowApm");

const router = express.Router();

router.use(
  "/auth",
  inflowApmMiddleware({ routePrefix: "/api/v1/auth" }),
  authRoutes
);
router.use(
  "/catalog",
  inflowApmMiddleware({ routePrefix: "/api/v1/catalog" }),
  catalogRoutes
);
router.use(
  "/commerce",
  inflowApmMiddleware({ routePrefix: "/api/v1/commerce" }),
  commerceRoutes
);
router.use(
  "/health",
  inflowApmMiddleware({ routePrefix: "/api/v1/health" }),
  healthRoutes
);
router.use(
  "/media",
  inflowApmMiddleware({ routePrefix: "/api/v1/media" }),
  mediaRoutes
);
router.use(
  "/reviews",
  inflowApmMiddleware({ routePrefix: "/api/v1/reviews" }),
  reviewRoutes
);

module.exports = router;
