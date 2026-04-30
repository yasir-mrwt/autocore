import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  decrementCartItem,
  incrementCartItem,
  removeFromCart,
  setCartItems,
} from "../store/slices/cartSlice";
import {
  addCartItem,
  canUseCommerceApi,
  createOrderFromCart,
  createStripeCheckoutSession,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../services/commerceService";
import { removeUser } from "../store/reducers/appReducer";
import { clearTokens } from "../utils/Token";

const Cart = ({ open, onClose, onOpenWishlist }) => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart?.items || []);
  const itemsRef = useRef(items);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    country: "Pakistan",
  });

  const total = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
    0
  );

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!open || !canUseCommerceApi()) return;

    let active = true;
    const syncCart = async () => {
      setSyncing(true);
      setMessage("");

      try {
        const unsyncedItems = itemsRef.current.filter((item) => !item.remoteItemId);
        let nextCart = null;

        for (const item of unsyncedItems) {
          nextCart = await addCartItem({
            productId: item.slug || item.productId || item.id,
            quantity: item.qty || 1,
          });
        }

        if (!nextCart) nextCart = await getCart();
        if (active) dispatch(setCartItems(nextCart.items));
      } catch (error) {
        if (active) {
          setMessage("Sign in with an AutoCore account to sync this cart.");
        }
      } finally {
        if (active) setSyncing(false);
      }
    };

    syncCart();

    return () => {
      active = false;
    };
  }, [dispatch, open]);

  const syncRemoteCart = (request) => {
    request
      .then((cart) => dispatch(setCartItems(cart.items)))
      .catch(() => setMessage("Could not sync cart right now."));
  };

  const handleIncrement = (item) => {
    dispatch(incrementCartItem(item.id));
    if (canUseCommerceApi() && item.remoteItemId) {
      syncRemoteCart(
        updateCartItem({
          itemId: item.remoteItemId,
          quantity: Number(item.qty || 1) + 1,
        })
      );
    }
  };

  const handleDecrement = (item) => {
    dispatch(decrementCartItem(item.id));
    if (!canUseCommerceApi()) return;

    const nextQuantity = Number(item.qty || 1) - 1;
    if (!item.remoteItemId) {
      if (nextQuantity < 1) {
        syncRemoteCart(removeCartItem(item.slug || item.productId || item.id));
      }
      return;
    }

    syncRemoteCart(
      nextQuantity < 1
        ? removeCartItem(item.remoteItemId)
        : updateCartItem({ itemId: item.remoteItemId, quantity: nextQuantity })
    );
  };

  const handleRemove = (item) => {
    dispatch(removeFromCart(item.id));
    if (canUseCommerceApi()) {
      syncRemoteCart(
        removeCartItem(item.remoteItemId || item.slug || item.productId || item.id)
      );
    }
  };

  const updateAddress = (field, value) => {
    setShippingAddress((current) => ({ ...current, [field]: value }));
  };

  const handleExpiredSession = () => {
    clearTokens("Buyer");
    dispatch(removeUser({ userType: "Buyer" }));
    setCheckoutOpen(false);
    setMessage("Your session expired. Please sign in again before checkout.");
  };

  const isUnauthorized = (error) => error?.response?.status === 401;

  const submitCheckout = async () => {
    if (!canUseCommerceApi()) {
      setMessage("Please sign in with an AutoCore account before checkout.");
      return;
    }

    setCheckoutLoading(true);
    setMessage("");

    try {
      const data = await createOrderFromCart({ shippingAddress });
      setMessage("Order created. Redirecting you to secure Stripe checkout...");

      try {
        const checkout = await createStripeCheckoutSession(data.order.orderNumber);
        if (checkout.checkoutUrl) {
          window.location.assign(checkout.checkoutUrl);
          return;
        }

        dispatch(setCartItems(data.cart.items));
        setCheckoutOpen(false);
        setMessage(`Order created: ${data.order.orderNumber}`);
      } catch (checkoutError) {
        if (isUnauthorized(checkoutError)) {
          handleExpiredSession();
          return;
        }

        setMessage(
          `Order created: ${data.order.orderNumber}. ${
            checkoutError?.response?.data?.message ||
            "Stripe checkout is not ready yet."
          }`
        );
      }
    } catch (error) {
      if (isUnauthorized(error)) {
        handleExpiredSession();
        return;
      }

      setMessage(
        error?.response?.data?.message ||
          "Could not create order. Please check the shipping details."
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[210] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close cart"
      />

      <aside className="commerce-drawer relative flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#1572D3]">
              Cart
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Your Parts
            </h2>
            {syncing && (
              <p className="mt-1 text-xs text-slate-400">Syncing cart...</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {!items.length ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingCart className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-2xl font-bold text-slate-900">
              Your cart is empty
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add spare parts from the shop to see them here.
            </p>
            <Link
              to="/shop?page=1"
              onClick={onClose}
              className="mt-6 inline-flex rounded-lg bg-[#1572D3] px-6 py-3 text-sm font-semibold text-white"
            >
              Shop Parts
            </Link>
            <button
              type="button"
              onClick={onOpenWishlist}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#1572D3]/20 px-5 py-2.5 text-sm font-semibold text-[#1572D3]"
            >
              <Heart className="h-4 w-4" />
              View Wishlist
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 shop-filter-scroll">
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-lg bg-[#F7FBFF] object-contain p-2"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        Rs {Number(item.price || 0).toLocaleString()}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecrement(item)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">
                          {item.qty || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrement(item)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      className="self-start rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <footer className="shrink-0 border-t border-slate-100 bg-white p-5">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    Order Summary
                  </h3>
                  <button
                    type="button"
                    onClick={onOpenWishlist}
                    className="text-xs font-semibold text-[#1572D3]"
                  >
                    Wishlist
                  </button>
                </div>
                <div className="mt-4 flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>Rs {total.toLocaleString()}</span>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span>Rs {total.toLocaleString()}</span>
                  </div>
                </div>
                {message && (
                  <p className="mt-3 rounded-lg bg-[#F7FBFF] px-3 py-2 text-xs font-medium text-slate-600">
                    {message}
                  </p>
                )}
                {checkoutOpen && (
                  <div className="mt-4 space-y-2">
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(event) => updateAddress("fullName", event.target.value)}
                      placeholder="Full name"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1572D3]"
                    />
                    <input
                      type="text"
                      value={shippingAddress.phone}
                      onChange={(event) => updateAddress("phone", event.target.value)}
                      placeholder="Phone"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1572D3]"
                    />
                    <input
                      type="text"
                      value={shippingAddress.line1}
                      onChange={(event) => updateAddress("line1", event.target.value)}
                      placeholder="Address"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1572D3]"
                    />
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(event) => updateAddress("city", event.target.value)}
                      placeholder="City"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1572D3]"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!canUseCommerceApi()) {
                      setMessage(
                        "Please sign in with an AutoCore account before checkout."
                      );
                      return;
                    }

                    checkoutOpen ? submitCheckout() : setCheckoutOpen(true);
                  }}
                  disabled={checkoutLoading}
                  className="mt-5 w-full rounded-lg bg-[#1572D3] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d5bb5]"
                >
                  {checkoutLoading
                    ? "Starting Checkout..."
                    : checkoutOpen
                      ? "Pay with Stripe"
                      : "Checkout"}
                </button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
};

export default Cart;
