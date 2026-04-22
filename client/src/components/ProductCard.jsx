import { Heart, ShoppingCart, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, setCartItems } from "../store/slices/cartSlice";
import { setWishlistItems, toggleWishlist } from "../store/slices/wishlistSlice";
import { normalizeProduct } from "../services/catalogService";
import {
  addCartItem,
  addWishlistItem,
  canUseCommerceApi,
  removeWishlistItemRemote,
} from "../services/commerceService";

const ProductCard = ({ product }) => {
  const item = normalizeProduct(product);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const wishItems = useSelector((state) => state.wishlist?.items || []);
  const isWished = wishItems.some((wishItem) => wishItem.id === item.id);
  const inStock = item.inStock !== false;
  const discount = item.originalPrice
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : null;

  const onCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
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
      addCartItem({ productId: item.slug || item.id, quantity: 1 })
        .then((cart) => dispatch(setCartItems(cart.items)))
        .catch(() => {});
    }
  };

  const onWish = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch(
      toggleWishlist({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
      })
    );

    if (canUseCommerceApi()) {
      const request = isWished
        ? removeWishlistItemRemote(item.remoteItemId || item.slug || item.id)
        : addWishlistItem(item.slug || item.id);

      request
        .then((wishlist) => dispatch(setWishlistItems(wishlist.items)))
        .catch(() => {});
    }
  };

  return (
    <div
      onClick={() => navigate(`/shop/product/${item.slug || item.id}`)}
      className="group relative flex min-w-[220px] max-w-[260px] cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-all duration-300 hover:border-[#1572D3] hover:shadow-lg md:min-w-[260px] md:max-w-[300px]"
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-[#F7FBFF]">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-contain p-5 transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {discount && (
            <span className="rounded-md bg-[#1572D3] px-2 py-0.5 text-[10px] font-bold text-white">
              -{discount}%
            </span>
          )}
          {item.badge === "hot" && !discount && (
            <span className="rounded-md bg-[#1572D3] px-2 py-0.5 text-[10px] font-bold text-white">
              HOT
            </span>
          )}
          {!inStock && (
            <span className="rounded-md bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-white">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#1572D3]">
          {item.category}
        </span>
        <h3 className="mb-1 min-h-11 line-clamp-2 text-base font-semibold leading-snug text-slate-800 transition-colors group-hover:text-[#1572D3]">
          {item.name}
        </h3>
        <p className="mb-3 hidden font-mono text-[11px] text-slate-400 sm:block">
          {item.partNumber || item.sku || "AUTOCORE-PART"}
        </p>
        <div className="mb-3 hidden items-center gap-0.5 sm:flex">
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              className="h-3 w-3"
              fill={index < item.rating ? "#F59E0B" : "none"}
              stroke={index < item.rating ? "#F59E0B" : "#D1D5DB"}
            />
          ))}
          <span className="ml-1 text-[11px] text-slate-400">
            ({item.reviews})
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="min-w-0">
            {item.originalPrice && (
              <p className="mb-0.5 text-[11px] leading-none text-slate-400 line-through">
                Rs {item.originalPrice.toLocaleString()}
              </p>
            )}
            <p className="text-base font-bold text-slate-900">
              Rs {item.price.toLocaleString()}
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={onWish}
              className={`rounded-lg border p-2 transition-colors ${isWished ? "border-[#1572D3]/20 bg-[#E8F1FB] text-[#1572D3]" : "border-slate-200 bg-white text-slate-400 hover:border-[#1572D3]/30 hover:text-[#1572D3]"}`}
              aria-label="Add to wishlist"
            >
              <Heart className="h-4 w-4" fill={isWished ? "currentColor" : "none"} />
            </button>
            <button
              onClick={onCart}
              disabled={!inStock}
              className="rounded-lg bg-[#1572D3] p-2 text-white transition-colors hover:bg-[#0d5bb5] disabled:cursor-not-allowed disabled:bg-slate-200"
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
