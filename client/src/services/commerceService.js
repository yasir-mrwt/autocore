import catalogClient, { normalizeProduct } from "./catalogService";
import { getAccessToken } from "../utils/Token";

export const canUseCommerceApi = () => Boolean(getAccessToken("Buyer"));

export const normalizeCartItem = (item = {}) => {
  const product = normalizeProduct(item.product || {});

  return {
    id: product.id || item.productId,
    remoteItemId: item.id,
    productId: item.productId || product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    stock: product.stock || 50,
    qty: item.quantity || 1,
    synced: true,
  };
};

export const normalizeWishlistItem = (item = {}) => {
  const product = normalizeProduct(item.product || {});

  return {
    id: product.id || item.productId,
    remoteItemId: item.id,
    productId: item.productId || product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    stock: product.stock || 50,
    synced: true,
  };
};

export const normalizeCart = (cart = {}) => ({
  items: (cart.items || []).map(normalizeCartItem),
  summary: cart.summary || { itemCount: 0, subtotal: 0, currency: "PKR" },
});

export const normalizeWishlist = (wishlist = {}) => ({
  items: (wishlist.items || []).map(normalizeWishlistItem),
  count: wishlist.count || 0,
});

export const getCart = async () => {
  const { data } = await catalogClient.get("/commerce/cart");
  return normalizeCart(data.cart);
};

export const addCartItem = async ({ productId, quantity = 1 }) => {
  const { data } = await catalogClient.post("/commerce/cart/items", {
    productId,
    quantity,
  });
  return normalizeCart(data.cart);
};

export const updateCartItem = async ({ itemId, quantity }) => {
  const { data } = await catalogClient.patch(`/commerce/cart/items/${itemId}`, {
    quantity,
  });
  return normalizeCart(data.cart);
};

export const removeCartItem = async (itemId) => {
  const { data } = await catalogClient.delete(`/commerce/cart/items/${itemId}`);
  return normalizeCart(data.cart);
};

export const clearRemoteCart = async () => {
  const { data } = await catalogClient.delete("/commerce/cart");
  return normalizeCart(data.cart);
};

export const getWishlist = async () => {
  const { data } = await catalogClient.get("/commerce/wishlist");
  return normalizeWishlist(data.wishlist);
};

export const addWishlistItem = async (productId) => {
  const { data } = await catalogClient.post("/commerce/wishlist/items", {
    productId,
  });
  return normalizeWishlist(data.wishlist);
};

export const removeWishlistItemRemote = async (itemIdOrProductId) => {
  const { data } = await catalogClient.delete(
    `/commerce/wishlist/items/${itemIdOrProductId}`
  );
  return normalizeWishlist(data.wishlist);
};

export const createOrderFromCart = async ({ shippingAddress, notes }) => {
  const { data } = await catalogClient.post("/commerce/orders", {
    shippingAddress,
    notes,
  });
  return data;
};

export const getOrders = async () => {
  const { data } = await catalogClient.get("/commerce/orders");
  return data.orders || [];
};

export const getAdminOrders = async (params = {}) => {
  const { data } = await catalogClient.get("/commerce/admin/orders", {
    authRole: "Admin",
    params,
  });
  return data.orders || [];
};

export const getAdminAnalytics = async () => {
  const { data } = await catalogClient.get("/commerce/admin/analytics", {
    authRole: "Admin",
  });
  return data;
};

export const updateAdminOrderDelivery = async (orderId, payload) => {
  const { data } = await catalogClient.patch(
    `/commerce/admin/orders/${orderId}/delivery`,
    payload,
    { authRole: "Admin" }
  );
  return data.order;
};

export const prepareAdminOrderDispatch = async (orderId, payload = {}) => {
  const { data } = await catalogClient.post(
    `/commerce/admin/orders/${orderId}/prepare-dispatch`,
    payload,
    { authRole: "Admin" }
  );
  return data.order;
};

export const shipAdminOrder = async (orderId, payload = {}) => {
  const { data } = await catalogClient.post(
    `/commerce/admin/orders/${orderId}/ship`,
    payload,
    { authRole: "Admin" }
  );
  return data.order;
};

export const sendAdminDeliveryConfirmation = async (orderId) => {
  const { data } = await catalogClient.post(
    `/commerce/admin/orders/${orderId}/send-confirmation`,
    {},
    { authRole: "Admin" }
  );
  return data.order;
};

export const adminMarkOrderDelivered = async (orderId, payload = {}) => {
  const { data } = await catalogClient.post(
    `/commerce/admin/orders/${orderId}/mark-delivered`,
    payload,
    { authRole: "Admin" }
  );
  return data.order;
};

export const getAdminCustomers = async () => {
  const { data } = await catalogClient.get("/commerce/admin/customers", {
    authRole: "Admin",
  });
  return data.customers || [];
};

export const confirmOrderDelivery = async (orderId) => {
  const { data } = await catalogClient.post(
    `/commerce/orders/${orderId}/confirm-delivery`
  );
  return data.order;
};

export const createStripeCheckoutSession = async (orderId) => {
  const { data } = await catalogClient.post(
    `/commerce/orders/${orderId}/checkout-session`
  );
  return data;
};
