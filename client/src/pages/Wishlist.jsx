import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, setCartItems } from "../store/slices/cartSlice";
import { removeFromWishlist, setWishlistItems } from "../store/slices/wishlistSlice";
import {
  addCartItem,
  addWishlistItem,
  canUseCommerceApi,
  getWishlist,
  removeWishlistItemRemote,
} from "../services/commerceService";

const Wishlist = ({ open, onClose, onOpenCart }) => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.wishlist?.items || []);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open || !canUseCommerceApi()) return;

    let active = true;
    const syncWishlist = async () => {
      setSyncing(true);
      setMessage("");

      try {
        const unsyncedItems = items.filter((item) => !item.remoteItemId);
        let nextWishlist = null;

        for (const item of unsyncedItems) {
          nextWishlist = await addWishlistItem(item.slug || item.productId || item.id);
        }

        if (!nextWishlist) nextWishlist = await getWishlist();
        if (active) dispatch(setWishlistItems(nextWishlist.items));
      } catch (error) {
        if (active) {
          setMessage("Sign in with an AutoCore account to sync saved parts.");
        }
      } finally {
        if (active) setSyncing(false);
      }
    };

    syncWishlist();

    return () => {
      active = false;
    };
  }, [open]);

  const moveToCart = (item) => {
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
      addCartItem({ productId: item.slug || item.productId || item.id, quantity: 1 })
        .then((cart) => dispatch(setCartItems(cart.items)))
        .catch(() => setMessage("Could not sync cart right now."));
    }

    onOpenCart?.();
  };

  const removeSavedItem = (item) => {
    dispatch(removeFromWishlist(item.id));

    if (canUseCommerceApi()) {
      removeWishlistItemRemote(item.remoteItemId || item.slug || item.productId || item.id)
        .then((wishlist) => dispatch(setWishlistItems(wishlist.items)))
        .catch(() => setMessage("Could not sync wishlist right now."));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[210] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close wishlist"
      />

      <aside className="commerce-drawer relative flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#1572D3]">
              Wishlist
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Saved Parts
            </h2>
            {syncing && (
              <p className="mt-1 text-xs text-slate-400">Syncing wishlist...</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
            aria-label="Close wishlist"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {!items.length ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <Heart className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-2xl font-bold text-slate-900">
              Your wishlist is empty
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Save spare parts you like and come back to them anytime.
            </p>
            <Link
              to="/shop?page=1"
              onClick={onClose}
              className="mt-6 inline-flex rounded-lg bg-[#1572D3] px-6 py-3 text-sm font-semibold text-white"
            >
              Shop Parts
            </Link>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 shop-filter-scroll">
              <div className="grid grid-cols-1 gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex gap-4 p-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-24 w-24 shrink-0 rounded-lg bg-[#F7FBFF] object-contain p-3"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1572D3]">
                          Saved Part
                        </p>
                        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">
                          {item.name}
                        </h3>
                        <p className="mt-2 text-sm font-bold text-slate-900">
                          Rs {Number(item.price || 0).toLocaleString()}
                        </p>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => moveToCart(item)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1572D3] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0d5bb5]"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSavedItem(item)}
                            className="rounded-lg border border-red-100 p-2 text-red-500 transition-colors hover:bg-red-50"
                            aria-label="Remove from wishlist"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <footer className="shrink-0 border-t border-slate-100 bg-white p-5">
              <div className="rounded-lg bg-[#F7FBFF] p-4">
                {message && (
                  <p className="mb-3 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-600">
                    {message}
                  </p>
                )}
                <p className="text-sm font-semibold text-slate-900">
                  Ready to order?
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add saved parts to your cart and check everything in one place.
                </p>
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="mt-4 w-full rounded-lg bg-[#1572D3] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d5bb5]"
                >
                  Open Cart
                </button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
};

export default Wishlist;
