const express = require("express");
const { requireAdmin, requireAuth, requireCustomer } = require("../../middleware/auth");
const validateRequest = require("../../middleware/validateRequest");
const CommerceController = require("./commerce.controller");
const {
  addCartItemValidator,
  addWishlistItemValidator,
  createOrderValidator,
  prepareDispatchValidator,
  shipOrderValidator,
  updateOrderDeliveryValidator,
  updateCartItemValidator,
} = require("./commerce.validators");

const router = express.Router();

router.post(
  "/delivery-confirmation/confirm",
  CommerceController.confirmOrderDeliveryByToken
);

router.patch(
  "/admin/orders/:orderId/delivery",
  requireAuth,
  requireAdmin,
  updateOrderDeliveryValidator,
  validateRequest,
  CommerceController.updateOrderDelivery
);
router.post(
  "/admin/orders/:orderId/prepare-dispatch",
  requireAuth,
  requireAdmin,
  prepareDispatchValidator,
  validateRequest,
  CommerceController.prepareOrderDispatch
);
router.post(
  "/admin/orders/:orderId/ship",
  requireAuth,
  requireAdmin,
  shipOrderValidator,
  validateRequest,
  CommerceController.shipOrder
);
router.post(
  "/admin/orders/:orderId/send-confirmation",
  requireAuth,
  requireAdmin,
  CommerceController.sendDeliveryConfirmation
);
router.post(
  "/admin/orders/:orderId/mark-delivered",
  requireAuth,
  requireAdmin,
  CommerceController.adminMarkDelivered
);
router.get(
  "/admin/analytics",
  requireAuth,
  requireAdmin,
  CommerceController.getAdminAnalytics
);
router.get(
  "/admin/customers",
  requireAuth,
  requireAdmin,
  CommerceController.listAdminCustomers
);
router.get(
  "/admin/orders",
  requireAuth,
  requireAdmin,
  CommerceController.listAdminOrders
);

router.use(requireAuth, requireCustomer);

router.get("/cart", CommerceController.getCart);
router.post(
  "/cart/items",
  addCartItemValidator,
  validateRequest,
  CommerceController.addCartItem
);
router.patch(
  "/cart/items/:itemId",
  updateCartItemValidator,
  validateRequest,
  CommerceController.updateCartItem
);
router.delete("/cart/items/:itemId", CommerceController.removeCartItem);
router.delete("/cart", CommerceController.clearCart);

router.get("/wishlist", CommerceController.getWishlist);
router.post(
  "/wishlist/items",
  addWishlistItemValidator,
  validateRequest,
  CommerceController.addWishlistItem
);
router.delete(
  "/wishlist/items/:itemIdOrProductId",
  CommerceController.removeWishlistItem
);

router.get("/orders", CommerceController.listOrders);
router.post(
  "/orders",
  createOrderValidator,
  validateRequest,
  CommerceController.createOrderFromCart
);
router.get("/orders/:orderId", CommerceController.getOrder);
router.post("/orders/:orderId/cancel", CommerceController.cancelOrder);
router.post("/orders/:orderId/confirm-delivery", CommerceController.confirmOrderDelivery);
router.post(
  "/orders/:orderId/checkout-session",
  CommerceController.createStripeCheckoutSession
);
router.post(
  "/orders/:orderId/sync-stripe-session",
  CommerceController.syncStripeCheckoutSession
);

module.exports = router;
