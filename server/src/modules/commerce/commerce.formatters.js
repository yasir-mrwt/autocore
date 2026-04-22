const { formatProduct } = require("../catalog/catalog.formatters");

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

const getLineTotal = (price, quantity) => toNumber(price, 0) * Number(quantity || 0);

const formatCartItem = (item) => {
  const product = item.product ? formatProduct(item.product) : null;
  const lineTotal = product ? getLineTotal(product.price, item.quantity) : 0;

  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product,
    lineTotal,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const formatCart = (items = []) => {
  const cartItems = items.map(formatCartItem);
  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: cartItems,
    summary: {
      itemCount,
      subtotal,
      currency: "PKR",
    },
  };
};

const formatWishlistItem = (item) => ({
  id: item.id,
  productId: item.productId,
  product: item.product ? formatProduct(item.product) : null,
  createdAt: item.createdAt,
});

const formatPayment = (payment) => ({
  id: payment.id,
  provider: payment.provider,
  providerOrderId: payment.providerOrderId,
  providerPaymentId: payment.providerPaymentId,
  status: payment.status,
  amount: toNumber(payment.amount),
  currency: payment.currency,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const formatOrderItem = (item) => ({
  id: item.id,
  productId: item.productId,
  productName: item.productName,
  sku: item.sku,
  partNumber: item.partNumber,
  price: toNumber(item.price),
  quantity: item.quantity,
  lineTotal: toNumber(item.lineTotal),
  product: item.product ? formatProduct(item.product) : null,
  createdAt: item.createdAt,
});

const formatOrderTimelineEvent = (event) => ({
  id: event.id,
  status: event.status,
  label: event.label,
  message: event.message,
  metadata: event.metadata,
  createdAt: event.createdAt,
  admin: event.admin
    ? {
        id: event.admin.id,
        name: event.admin.name,
        email: event.admin.email,
      }
    : null,
});

const formatOrder = (order) => ({
  id: order.id,
  orderNumber: order.orderNumber,
  status: order.status,
  paymentStatus: order.paymentStatus,
  subtotal: toNumber(order.subtotal),
  shippingFee: toNumber(order.shippingFee),
  tax: toNumber(order.tax),
  discount: toNumber(order.discount),
  total: toNumber(order.total),
  currency: order.currency,
  shippingAddress: order.shippingAddressSnapshot,
  notes: order.notes,
  estimatedDeliveryAt: order.estimatedDeliveryAt,
  readyForDispatchAt: order.readyForDispatchAt,
  dispatchPreparedAt: order.readyForDispatchAt,
  shippedAt: order.shippedAt,
  deliveredAt: order.deliveredAt,
  courierName: order.courierName,
  trackingNumber: order.trackingNumber,
  trackingUrl: order.trackingUrl,
  shipmentNotes: order.shipmentNotes,
  deliveryConfirmationDueAt: order.deliveryConfirmationDueAt,
  deliveryConfirmationSentAt: order.deliveryConfirmationSentAt,
  deliveryConfirmedAt: order.deliveryConfirmedAt,
  placedAt: order.placedAt,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  items: (order.items || []).map(formatOrderItem),
  payments: (order.payments || []).map(formatPayment),
  timeline: (order.timeline || []).map(formatOrderTimelineEvent),
  customer: order.user
    ? {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      }
    : null,
});

module.exports = {
  formatCart,
  formatCartItem,
  formatOrder,
  formatOrderTimelineEvent,
  formatWishlistItem,
};
