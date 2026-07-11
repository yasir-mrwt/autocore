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
import { removeUser, updateUser } from "../store/reducers/appReducer";
import { clearTokens } from "../utils/Token";
import { notifySuccess } from "../utils/Toast";

const emptyShippingAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  country: "Pakistan",
};

const getProfileShippingAddress = (user) => ({
  ...emptyShippingAddress,
  fullName: user?.defaultShippingAddress?.fullName || user?.name || "",
  phone: user?.defaultShippingAddress?.phone || user?.phone || "",
  line1: user?.defaultShippingAddress?.line1 || "",
  line2: user?.defaultShippingAddress?.line2 || "",
  city: user?.defaultShippingAddress?.city || "",
  country: user?.defaultShippingAddress?.country || "Pakistan",
});

const validateShippingAddress = (address) => {
  const errors = {};
  if (!String(address.fullName || "").trim() || String(address.fullName || "").trim().length < 2) {
    errors.fullName = "Enter the receiver name.";
  }
  if (!String(address.phone || "").trim() || String(address.phone || "").trim().length < 7) {
    errors.phone = "Enter a valid phone number.";
  }
  if (!String(address.line1 || "").trim() || String(address.line1 || "").trim().length < 4) {
    errors.line1 = "Enter a valid delivery address.";
  }
  if (String(address.line2 || "").trim().length > 160) {
    errors.line2 = "Address detail is too long.";
  }
  if (!String(address.city || "").trim() || String(address.city || "").trim().length < 2) {
    errors.city = "Enter a valid city.";
  }
  if (!String(address.country || "").trim() || String(address.country || "").trim().length < 2) {
    errors.country = "Enter a valid country.";
  }
  return errors;
};

const Cart = ({ open, onClose, onOpenWishlist }) => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart?.items || []);
  const customerUser = useSelector((state) => state.app?.customer?.user || state.app?.user);
  const itemsRef = useRef(items);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(emptyShippingAddress);
  const [addressTouched, setAddressTouched] = useState({});
  const [checkoutAttempted, setCheckoutAttempted] = useState(false);
  const hasSavedCheckoutDetails = Boolean(customerUser?.defaultShippingAddress);
  const addressErrors = validateShippingAddress(shippingAddress);

  const total = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
    0
  );

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!open) return;
    setShippingAddress(getProfileShippingAddress(customerUser));
    setAddressTouched({});
    setCheckoutAttempted(false);
  }, [customerUser, open]);

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

  const markAddressTouched = (field) => {
    setAddressTouched((current) => ({ ...current, [field]: true }));
  };

  const getAddressError = (field) =>
    (addressTouched[field] || checkoutAttempted) ? addressErrors[field] : "";

  const handleExpiredSession = () => {
    clearTokens("Buyer");
    dispatch(removeUser({ userType: "Buyer" }));
    setCheckoutOpen(false);
    setMessage("Your session expired. Please sign in again before checkout.");
  };

  const isUnauthorized = (error) =>
    error?.response?.status === 401 || error?.response?.status === 403;

  const submitCheckout = async () => {
    if (!canUseCommerceApi()) {
      setMessage("Please sign in with an AutoCore account before checkout.");
      return;
    }

    setCheckoutLoading(true);
    setMessage("");
    setCheckoutAttempted(true);

    if (Object.keys(addressErrors).length) {
      setAddressTouched({
        fullName: true,
        phone: true,
        line1: true,
        line2: true,
        city: true,
        country: true,
      });
      setMessage("Please correct the highlighted checkout details.");
      setCheckoutOpen(true);
      setCheckoutLoading(false);
      return;
    }

    try {
      const data = await createOrderFromCart({ shippingAddress });
      setMessage("Order created. Redirecting you to secure Stripe checkout...");
      notifySuccess("Order created. You can view it in the Recent tab.");

      dispatch(
        updateUser({
          userType: "Buyer",
          user: {
            ...(customerUser || {}),
            phone: shippingAddress.phone,
            defaultShippingAddress:
              data.defaultShippingAddress || {
                ...shippingAddress,
                isDefault: true,
              },
          },
        })
      );

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
                {!checkoutOpen && hasSavedCheckoutDetails && (
                  <div className="mt-4 rounded-lg border border-[#1572D3]/15 bg-[#F7FBFF] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1572D3]">
                          Saved checkout details
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {shippingAddress.fullName}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {[shippingAddress.phone, shippingAddress.line1, shippingAddress.line2, shippingAddress.city, shippingAddress.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCheckoutOpen(true)}
                        className="shrink-0 rounded-md border border-[#1572D3]/20 px-2.5 py-1.5 text-xs font-semibold text-[#1572D3]"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}
                {checkoutOpen && (
                  <div className="mt-4 space-y-2">
                    <p className="rounded-lg bg-[#F7FBFF] px-3 py-2 text-xs font-medium text-slate-600">
                      {hasSavedCheckoutDetails
                        ? "Saved checkout details loaded from your profile."
                        : "These details will be saved for your next checkout."}
                    </p>
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(event) => updateAddress("fullName", event.target.value)}
                      onBlur={() => markAddressTouched("fullName")}
                      placeholder="Full name"
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1572D3] ${getAddressError("fullName") ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                    />
                    {getAddressError("fullName") && (
                      <p className="text-xs font-medium text-red-600">{getAddressError("fullName")}</p>
                    )}
                    <input
                      type="text"
                      value={shippingAddress.phone}
                      onChange={(event) => updateAddress("phone", event.target.value)}
                      onBlur={() => markAddressTouched("phone")}
                      placeholder="Phone"
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1572D3] ${getAddressError("phone") ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                    />
                    {getAddressError("phone") && (
                      <p className="text-xs font-medium text-red-600">{getAddressError("phone")}</p>
                    )}
                    <input
                      type="text"
                      value={shippingAddress.line1}
                      onChange={(event) => updateAddress("line1", event.target.value)}
                      onBlur={() => markAddressTouched("line1")}
                      placeholder="Address"
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1572D3] ${getAddressError("line1") ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                    />
                    {getAddressError("line1") && (
                      <p className="text-xs font-medium text-red-600">{getAddressError("line1")}</p>
                    )}
                    <input
                      type="text"
                      value={shippingAddress.line2}
                      onChange={(event) => updateAddress("line2", event.target.value)}
                      onBlur={() => markAddressTouched("line2")}
                      placeholder="Apartment, area, or landmark (optional)"
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1572D3] ${getAddressError("line2") ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                    />
                    {getAddressError("line2") && (
                      <p className="text-xs font-medium text-red-600">{getAddressError("line2")}</p>
                    )}
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(event) => updateAddress("city", event.target.value)}
                      onBlur={() => markAddressTouched("city")}
                      placeholder="City"
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1572D3] ${getAddressError("city") ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                    />
                    {getAddressError("city") && (
                      <p className="text-xs font-medium text-red-600">{getAddressError("city")}</p>
                    )}
                    <input
                      type="text"
                      value={shippingAddress.country}
                      onChange={(event) => updateAddress("country", event.target.value)}
                      onBlur={() => markAddressTouched("country")}
                      placeholder="Country"
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1572D3] ${getAddressError("country") ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                    />
                    {getAddressError("country") && (
                      <p className="text-xs font-medium text-red-600">{getAddressError("country")}</p>
                    )}
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

                    if (checkoutOpen || hasSavedCheckoutDetails) {
                      submitCheckout();
                    } else {
                      setCheckoutOpen(true);
                    }
                  }}
                  disabled={checkoutLoading}
                  className="mt-5 w-full rounded-lg bg-[#1572D3] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d5bb5]"
                >
                  {checkoutLoading
                    ? "Starting Checkout..."
                    : checkoutOpen
                      ? "Pay with Stripe"
                      : hasSavedCheckoutDetails
                        ? "Checkout with saved details"
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
