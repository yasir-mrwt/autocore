import {
  Clock3,
  CreditCard,
  PackageCheck,
  PackageSearch,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, setCartItems } from "../../store/slices/cartSlice";
import {
  addCartItem,
  canUseCommerceApi,
  confirmOrderDelivery,
  getOrders,
} from "../../services/commerceService";
import {
  getRecentlyViewed,
  removeRecentlyViewed,
} from "../../services/recentlyViewedService";

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "";

const getDeliveryText = (order, now) => {
  if (order.status === "DELIVERED") return "Delivered";
  if (!order.estimatedDeliveryAt) return "Waiting for delivery estimate";

  const diff = new Date(order.estimatedDeliveryAt).getTime() - now.getTime();
  if (diff <= 0) return "Delivery due now";

  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return `${Math.max(minutes, 1)}m remaining`;
};

const getPaymentLabel = (paymentStatus) => {
  if (paymentStatus === "SUCCEEDED") return "Paid";
  if (paymentStatus === "FAILED") return "Payment failed";
  if (paymentStatus === "CANCELLED") return "Payment cancelled";
  return "Payment pending";
};

const getOrderStatusLabel = (status) => {
  const labels = {
    PENDING_PAYMENT: "Waiting for payment",
    PAID: "Paid - waiting for admin",
    PROCESSING: "Processing",
    READY_TO_DISPATCH: "Ready to dispatch",
    SHIPPED: "Shipped / In transit",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
  };

  return labels[status] || String(status || "").replaceAll("_", " ");
};

const WatchList = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.app?.user);
  const userId = user?.id || user?._id || "guest";
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(new Date());

  const loadOrders = (active = true) => {
    if (!canUseCommerceApi()) return;
    setOrdersLoading(true);
    getOrders()
      .then((nextOrders) => {
        if (active) setOrders(nextOrders);
      })
      .catch(() => {
        if (active) setMessage("Could not load purchased parts right now.");
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });
  };

  useEffect(() => {
    setItems(getRecentlyViewed(userId));
  }, [userId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!canUseCommerceApi()) return;

    let active = true;
    loadOrders(active);
    const intervalId = window.setInterval(() => loadOrders(active), 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const purchasedItems = useMemo(
    () =>
      orders
        .filter((order) => order.status !== "CANCELLED")
        .flatMap((order) =>
          (order.items || []).map((item) => ({
            id: `${order.id}-${item.id}`,
            order,
            item,
            product: item.product,
          }))
        ),
    [orders]
  );

  const removeViewedPart = (item) => {
    setItems(removeRecentlyViewed(userId, item.id));
  };

  const addViewedPartToCart = (item) => {
    dispatch(
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        stock: item.stock || 50,
      })
    );

    if (canUseCommerceApi()) {
      addCartItem({
        productId: item.slug || item.id,
        quantity: 1,
      })
        .then((cart) => dispatch(setCartItems(cart.items)))
        .catch(() => setMessage("Could not sync this part to cart."));
    }
  };

  const confirmReceived = async (order) => {
    setConfirmingOrder(order.orderNumber);
    try {
      const updatedOrder = await confirmOrderDelivery(order.orderNumber);
      setOrders((current) =>
        current.map((item) => (item.id === updatedOrder.id ? updatedOrder : item))
      );
      setMessage("Thanks. Delivery has been confirmed.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Could not confirm delivery.");
    } finally {
      setConfirmingOrder("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="container px-4 py-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link to="/" className="transition-colors hover:text-[#1572D3]">
                  Home
                </Link>
                <span>/</span>
                <span className="font-semibold text-slate-900">
                  Activity
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-950 md:text-[38px]">
                Your AutoCore Activity
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Track purchased parts, payment state, delivery timing, and parts you opened recently.
              </p>
            </div>

            <Link
              to="/shop?page=1"
              className="inline-flex w-fit rounded-lg bg-[#1572D3] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d5bb5]"
            >
              Browse Parts
            </Link>
          </div>
        </div>
      </section>

      <section className="container px-4 py-8">
        {message && (
          <div className="mb-5 rounded-lg border border-[#1572D3]/10 bg-[#E8F1FB] px-4 py-3 text-sm font-medium text-slate-700">
            {message}
          </div>
        )}

        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1572D3]">
                Purchased Parts
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                Orders and delivery
              </h2>
            </div>
            {ordersLoading && (
              <span className="text-xs font-semibold text-slate-400">
                Loading...
              </span>
            )}
          </div>

          {purchasedItems.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {purchasedItems.map(({ id, order, item, product }) => (
                <article
                  key={id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    <Link
                      to={`/shop/product/${product?.slug || item.productId}`}
                      className="grid h-24 w-24 shrink-0 place-items-center rounded-lg bg-[#F7FBFF]"
                    >
                      <img
                        src={product?.image}
                        alt={item.productName}
                        className="h-full w-full object-contain p-3"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1572D3]">
                        {order.orderNumber}
                      </p>
                      <Link to={`/shop/product/${product?.slug || item.productId}`}>
                        <h3 className="mt-1 line-clamp-2 text-base font-bold text-slate-950 hover:text-[#1572D3]">
                          {item.productName}
                        </h3>
                      </Link>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatCurrency(item.lineTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                      <span className="flex items-center gap-2">
                        <PackageCheck className="h-4 w-4 text-[#1572D3]" />
                        Order state
                      </span>
                      <span className="text-right font-semibold text-slate-900">
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-[#1572D3]" />
                        Payment
                      </span>
                      <span className="font-semibold text-slate-900">
                        {getPaymentLabel(order.paymentStatus)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                      <span className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-[#1572D3]" />
                        Delivery
                      </span>
                      <span className="text-right font-semibold text-slate-900">
                        {getDeliveryText(order, now)}
                      </span>
                    </div>
                    {order.estimatedDeliveryAt && (
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <span>Estimated date</span>
                        <span className="font-semibold text-slate-900">
                          {formatDate(order.estimatedDeliveryAt)}
                        </span>
                      </div>
                    )}
                    {order.courierName && (
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <span>Courier</span>
                        <span className="font-semibold text-slate-900">
                          {order.courierName}
                        </span>
                      </div>
                    )}
                    {order.trackingNumber && (
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <span>Tracking</span>
                        {order.trackingUrl ? (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-[#1572D3]"
                          >
                            {order.trackingNumber}
                          </a>
                        ) : (
                          <span className="font-semibold text-slate-900">
                            {order.trackingNumber}
                          </span>
                        )}
                      </div>
                    )}
                    {order.deliveryConfirmationDueAt && !order.deliveryConfirmedAt && (
                      <div className="rounded-lg bg-[#E8F1FB] px-3 py-2 text-[#1572D3]">
                        Confirmation reminder scheduled for{" "}
                        {formatDate(order.deliveryConfirmationDueAt)}.
                      </div>
                    )}
                  </div>

                  {!!order.timeline?.length && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Order timeline
                      </p>
                      <div className="space-y-3">
                        {order.timeline.map((event) => (
                          <div key={event.id} className="flex gap-3">
                            <span className="mt-1 h-2 w-2 rounded-full bg-[#1572D3]" />
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {event.label}
                              </p>
                              {event.message && (
                                <p className="text-xs leading-5 text-slate-500">
                                  {event.message}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.status === "SHIPPED" && !order.deliveryConfirmedAt && (
                    <button
                      type="button"
                      onClick={() => confirmReceived(order)}
                      disabled={confirmingOrder === order.orderNumber}
                      className="mt-4 w-full rounded-lg bg-[#1572D3] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0d5bb5] disabled:opacity-60"
                    >
                      {confirmingOrder === order.orderNumber
                        ? "Confirming..."
                        : "Confirm Received"}
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <PackageCheck className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-lg font-bold text-slate-950">
                No purchased parts yet
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Paid orders will appear here with delivery tracking.
              </p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1572D3]">
            Recently Viewed
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Opened parts
          </h2>
        </div>

        {items.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:border-[#1572D3] hover:shadow-md"
              >
                <Link to={`/shop/product/${item.slug || item.id}`}>
                  <div className="relative aspect-[5/4] bg-[#F7FBFF]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain p-6"
                      loading="lazy"
                    />
                    <span className="absolute left-3 top-3 rounded-md bg-[#1572D3] px-2 py-1 text-[10px] font-bold uppercase text-white">
                      Viewed
                    </span>
                  </div>
                </Link>

                <div className="p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#1572D3]">
                    <Clock3 className="h-3.5 w-3.5" />
                    Recently opened
                  </p>
                  <Link to={`/shop/product/${item.slug || item.id}`}>
                    <h2 className="mt-1 line-clamp-2 min-h-11 text-base font-semibold text-slate-900 transition-colors hover:text-[#1572D3]">
                      {item.name}
                    </h2>
                  </Link>
                  <p className="mt-3 text-lg font-bold text-slate-950">
                    {formatCurrency(item.price)}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => addViewedPartToCart(item)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1572D3] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0d5bb5]"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      onClick={() => removeViewedPart(item)}
                      className="rounded-lg border border-red-100 p-2.5 text-red-500 transition-colors hover:bg-red-50"
                      aria-label="Remove recently viewed part"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[34vh] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#E8F1FB] text-[#1572D3]">
              <PackageSearch className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-950">
              No recently viewed parts yet
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Open any product detail page and it will appear here for quick access.
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default WatchList;
