const { body } = require("express-validator");

const productIdRule = body("productId")
  .trim()
  .notEmpty()
  .withMessage("Product id, slug, SKU, or part number is required.");

const quantityRule = body("quantity")
  .optional()
  .isInt({ min: 1, max: 99 })
  .withMessage("Quantity must be between 1 and 99.")
  .toInt();

const requiredQuantityRule = body("quantity")
  .isInt({ min: 1, max: 99 })
  .withMessage("Quantity must be between 1 and 99.")
  .toInt();

const shippingAddressValidator = [
  body("shippingAddress.fullName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Shipping full name is required."),
  body("shippingAddress.phone")
    .trim()
    .isLength({ min: 7 })
    .withMessage("Shipping phone is required."),
  body("shippingAddress.line1")
    .trim()
    .isLength({ min: 4 })
    .withMessage("Shipping address line 1 is required."),
  body("shippingAddress.line2")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 160 })
    .withMessage("Shipping address line 2 is too long."),
  body("shippingAddress.city")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Shipping city is required."),
  body("shippingAddress.state")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("Shipping state is too long."),
  body("shippingAddress.postalCode")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage("Shipping postal code is too long."),
  body("shippingAddress.country")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Shipping country is too short."),
  body("notes").optional({ nullable: true }).trim().isLength({ max: 500 }),
];

const orderStatuses = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "READY_TO_DISPATCH",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const pakistanCouriers = [
  "TCS",
  "Leopards Courier",
  "M&P Courier",
  "Trax",
  "Call Courier",
  "BlueEx",
  "PostEx",
  "Pakistan Post",
  "DHL Pakistan",
  "FedEx Pakistan",
];

const updateOrderDeliveryValidator = [
  body("deliveryDays")
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage("Delivery days must be between 1 and 120.")
    .toInt(),
  body("estimatedDeliveryAt")
    .optional()
    .isISO8601()
    .withMessage("Estimated delivery date must be a valid date."),
  body("status")
    .optional()
    .isIn(orderStatuses)
    .withMessage("Order status is invalid."),
];

const prepareDispatchValidator = [
  body("deliveryDays")
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage("Delivery days must be between 1 and 120.")
    .toInt(),
  body("estimatedDeliveryAt")
    .optional()
    .isISO8601()
    .withMessage("Estimated delivery date must be a valid date."),
  body("note").optional({ nullable: true }).trim().isLength({ max: 500 }),
];

const shipOrderValidator = [
  body("deliveryDays")
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage("Delivery days must be between 1 and 120.")
    .toInt(),
  body("estimatedDeliveryAt")
    .optional()
    .isISO8601()
    .withMessage("Estimated delivery date must be a valid date."),
  body("courierName")
    .trim()
    .notEmpty()
    .withMessage("Courier name is required.")
    .isIn(pakistanCouriers)
    .withMessage("Courier name is invalid."),
  body("trackingNumber")
    .trim()
    .notEmpty()
    .withMessage("Tracking number is required.")
    .isLength({ max: 120 }),
  body("trackingUrl")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Tracking URL is too long."),
  body("shipmentNotes").optional({ nullable: true }).trim().isLength({ max: 500 }),
];

module.exports = {
  addCartItemValidator: [productIdRule, quantityRule],
  addWishlistItemValidator: [productIdRule],
  updateCartItemValidator: [requiredQuantityRule],
  createOrderValidator: shippingAddressValidator,
  prepareDispatchValidator,
  shipOrderValidator,
  updateOrderDeliveryValidator,
};
