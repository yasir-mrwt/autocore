const express = require("express");
const { requireAuth, requireCustomer } = require("../../middleware/auth");
const validateRequest = require("../../middleware/validateRequest");
const ReviewController = require("./review.controller");
const { createReviewValidator } = require("./review.validators");

const router = express.Router();

router.get("/products/:productId", ReviewController.listProductReviews);
router.post(
  "/products/:productId",
  requireAuth,
  requireCustomer,
  createReviewValidator,
  validateRequest,
  ReviewController.createOrUpdateProductReview
);
router.delete(
  "/:reviewId",
  requireAuth,
  requireCustomer,
  ReviewController.deleteProductReview
);

module.exports = router;
