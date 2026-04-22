const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const catalogRoutes = require("../modules/catalog/catalog.routes");
const commerceRoutes = require("../modules/commerce/commerce.routes");
const healthRoutes = require("../modules/health/health.routes");
const reviewRoutes = require("../modules/reviews/review.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/catalog", catalogRoutes);
router.use("/commerce", commerceRoutes);
router.use("/health", healthRoutes);
router.use("/reviews", reviewRoutes);

module.exports = router;
