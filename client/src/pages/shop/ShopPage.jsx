import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Heart,
  List,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, clearCart, setCartItems } from "../../store/slices/cartSlice";
import { setWishlistItems, toggleWishlist } from "../../store/slices/wishlistSlice";
import {
  getBrands,
  getCategories,
  getProducts,
  normalizeProduct,
} from "../../services/catalogService";
import {
  addCartItem,
  addWishlistItem,
  canUseCommerceApi,
  removeWishlistItemRemote,
} from "../../services/commerceService";

const SORT_OPTIONS = [
  { label: "Most Popular", value: "popular" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
];

const ShopCard = ({ product, view }) => {
  const item = normalizeProduct(product);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishItems = useSelector((state) => state.wishlist?.items || []);
  const isWished = wishItems.some((wishItem) => wishItem.id === item.id);
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

  const openDetails = () => {
    navigate(`/shop/product/${item.slug || item.id}`);
  };

  if (view === "list") {
    return (
      <div
        onClick={openDetails}
        className="group relative flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-white p-3 pr-12 transition-all hover:border-[#1572D3] hover:shadow-md sm:gap-5 sm:p-4"
      >
        <button
          onClick={onWish}
          className={`absolute right-3 top-3 z-10 rounded-lg border p-2 transition-colors ${isWished ? "border-[#1572D3]/20 bg-[#E8F1FB] text-[#1572D3]" : "border-slate-200 bg-white text-slate-400 hover:border-[#1572D3]/30 hover:text-[#1572D3]"}`}
          aria-label="Add to wishlist"
        >
          <Heart className="h-4 w-4" fill={isWished ? "currentColor" : "none"} />
        </button>
        <button
          onClick={onCart}
          disabled={!item.inStock}
          className="absolute bottom-3 right-3 z-10 flex rounded-lg bg-[#1572D3] p-2 text-white shadow transition-colors hover:bg-[#0d5bb5] disabled:cursor-not-allowed disabled:bg-slate-200 sm:hidden"
          aria-label="Add to cart"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>

        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[#F7FBFF] sm:h-36 sm:w-36">
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {discount && (
            <span className="absolute left-2 top-2 rounded-md bg-[#1572D3] px-2 py-0.5 text-[10px] font-bold text-white">
              -{discount}%
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1572D3]">
              {item.category}
            </p>
            <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-slate-800 transition-colors group-hover:text-[#1572D3] sm:text-base">
              {item.name}
            </h3>
            <p className="mt-0.5 font-mono text-[11px] text-slate-400">
              {item.partNumber}
            </p>
            <div className="mt-2 hidden items-center gap-0.5 sm:flex">
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
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              {item.originalPrice && (
                <p className="text-[11px] text-slate-400 line-through">
                  Rs {item.originalPrice.toLocaleString()}
                </p>
              )}
              <p className="text-sm font-bold text-slate-900 sm:text-lg">
                Rs {item.price.toLocaleString()}
              </p>
            </div>
            <button
              onClick={onCart}
              disabled={!item.inStock}
              className="hidden items-center gap-1.5 rounded-lg bg-[#1572D3] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0d5bb5] disabled:cursor-not-allowed disabled:bg-slate-200 sm:flex sm:px-4"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{item.inStock ? "Add to Cart" : "Out of Stock"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={openDetails}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-all duration-300 hover:border-[#1572D3] hover:shadow-lg"
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
          {!item.inStock && (
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
          {item.partNumber}
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
              disabled={!item.inStock}
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

const SideSection = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="text-xs font-medium uppercase tracking-[0.28em] text-slate-700">
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
};

export default function ShopPage() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState(params.get("keyword") || "");
  const [selCats, setSelCats] = useState(() =>
    params.get("category") ? [params.get("category")] : []
  );
  const [selMakes, setSelMakes] = useState(() =>
    params.get("make") ? [params.get("make")] : []
  );
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyOnSale, setOnlyOnSale] = useState(false);
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState("grid");
  const [sideOpen, setSideOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);
  const paymentStatus = params.get("payment");
  const paymentOrder = params.get("order");

  useEffect(() => {
    if (paymentStatus === "success") {
      dispatch(clearCart());
    }
  }, [dispatch, paymentStatus]);

  const activeFilterCount =
    selCats.length +
    selMakes.length +
    (onlyInStock ? 1 : 0) +
    (onlyOnSale ? 1 : 0) +
    (keyword ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);
  const pageTitle =
    selCats.length === 1
      ? selCats[0]
      : selMakes.length === 1
        ? `${selMakes[0]} Parts`
        : "All Spare Parts";

  useEffect(() => {
    let active = true;

    setFilterLoading(true);
    Promise.all([getCategories(), getBrands()])
      .then(([nextCategories, nextBrands]) => {
        if (!active) return;
        setCategories(nextCategories);
        setBrands(nextBrands);
      })
      .catch(() => {
        if (active) setError("Could not load filter options.");
      })
      .finally(() => {
        if (active) setFilterLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setKeyword(params.get("keyword") || "");
    setSelCats(params.get("category") ? [params.get("category")] : []);
    setSelMakes(params.get("make") ? [params.get("make")] : []);
  }, [params]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      getProducts({
        page: 1,
        limit: visibleCount,
        keyword,
        category: selCats[0],
        make: selMakes[0],
        minPrice,
        maxPrice,
        inStock: onlyInStock ? "true" : "",
        onSale: onlyOnSale ? "true" : "",
        sort,
      })
        .then(({ products: nextProducts, pagination: nextPagination }) => {
          if (!active) return;
          setProducts(nextProducts);
          setPagination(nextPagination);
        })
        .catch(() => {
          if (!active) return;
          setProducts([]);
          setPagination(null);
          setError("Could not load parts right now. Check that the backend is running.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    keyword,
    maxPrice,
    minPrice,
    onlyInStock,
    onlyOnSale,
    selCats,
    selMakes,
    sort,
    visibleCount,
  ]);

  useEffect(() => {
    setVisibleCount(9);
  }, [keyword, maxPrice, minPrice, onlyInStock, onlyOnSale, selCats, selMakes, sort]);

  const toggleCat = (category) =>
    setSelCats((items) => (items.includes(category) ? [] : [category]));
  const toggleMake = (make) =>
    setSelMakes((items) => (items.includes(make) ? [] : [make]));
  const clearAll = () => {
    setKeyword("");
    setSelCats([]);
    setSelMakes([]);
    setMinPrice("");
    setMaxPrice("");
    setOnlyInStock(false);
    setOnlyOnSale(false);
  };

  const SidebarContent = () => (
    <div>
      <div className="sticky top-0 z-10 bg-white pb-3">
        <div className="pb-3">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-slate-700">
            Search Parts
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Part name or number..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1572D3]"
            />
          </div>
        </div>

        <div className="border-y border-slate-100 py-3">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-slate-700">
            Category
          </h3>
          <div className="max-h-36 space-y-2 overflow-y-auto pr-1 shop-filter-scroll">
            {filterLoading && (
              <p className="text-sm text-slate-400">Loading categories...</p>
            )}
            {categories.map((category) => (
              <label
                key={category.id || category.name}
                className="group flex cursor-pointer items-center gap-2.5"
              >
                <input
                  type="checkbox"
                  checked={selCats.includes(category.name)}
                  onChange={() => toggleCat(category.name)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#1572D3] focus:ring-[#1572D3]"
                />
                <span className="flex-1 text-sm text-slate-700 transition-colors group-hover:text-[#1572D3]">
                  {category.name}
                </span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-400">
                  {category.productCount || 0}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <SideSection title="Vehicle Make">
        <div className="space-y-2">
          {filterLoading && <p className="text-sm text-slate-400">Loading makes...</p>}
          {brands.map((brand) => (
            <label
              key={brand.id || brand.name}
              className="group flex cursor-pointer items-center gap-2.5"
            >
              <input
                type="checkbox"
                checked={selMakes.includes(brand.name)}
                onChange={() => toggleMake(brand.name)}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#1572D3] focus:ring-[#1572D3]"
              />
              <span className="flex-1 text-sm text-slate-700 transition-colors group-hover:text-[#1572D3]">
                {brand.name}
              </span>
            </label>
          ))}
        </div>
      </SideSection>

      <SideSection title="Price Range">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="Min"
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1572D3]"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Max"
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1572D3]"
            />
          </div>
        </div>
      </SideSection>

      <SideSection title="Availability & Deals">
        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(event) => setOnlyInStock(event.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#1572D3] focus:ring-[#1572D3]"
            />
            <span className="text-sm text-slate-700">In Stock Only</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={onlyOnSale}
              onChange={(event) => setOnlyOnSale(event.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#1572D3] focus:ring-[#1572D3]"
            />
            <span className="text-sm text-slate-700">On Sale Only</span>
          </label>
        </div>
      </SideSection>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          className="mt-2 w-full rounded-lg border border-[#1572D3]/20 py-2 text-sm font-medium text-[#1572D3] transition-colors hover:bg-[#E8F1FB]"
        >
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex w-full">
        <aside className="hidden w-[290px] shrink-0 border-r border-slate-200 bg-white lg:block xl:w-[315px]">
          <div className="sticky top-20 flex h-[calc(100vh-5rem)] flex-col overflow-hidden px-6 py-5">
            <div className="mb-3 flex shrink-0 items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <SlidersHorizontal className="h-4 w-4 text-[#1572D3]" />
                Filters
              </h2>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#E8F1FB] px-2 py-0.5 text-[11px] font-bold text-[#1572D3]">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 shop-filter-scroll">
              <SidebarContent />
            </div>
          </div>
        </aside>

        {sideOpen && (
          <div className="fixed inset-0 z-[200] flex lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setSideOpen(false)}
            />
            <div className="filter-drawer relative flex h-full w-80 max-w-[90vw] flex-col overflow-hidden bg-white p-4 shadow-xl">
              <div className="mb-4 flex shrink-0 items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <SlidersHorizontal className="h-4 w-4 text-[#1572D3]" />
                  Filters
                </h2>
                <button
                  onClick={() => setSideOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1 shop-filter-scroll">
                <SidebarContent />
              </div>
              <button
                onClick={() => setSideOpen(false)}
                className="mt-4 w-full shrink-0 rounded-lg bg-[#1572D3] py-2.5 font-semibold text-white transition-colors hover:bg-[#0d5bb5]"
              >
                View Results
              </button>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-0 py-0 sm:px-6 sm:py-5 lg:px-8">
          <div className="px-3 py-4 text-sm sm:px-0 sm:pt-0">
            <Link to="/" className="text-slate-500 transition-colors hover:text-[#1572D3]">
              Home
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="font-semibold text-slate-950">{pageTitle}</span>
          </div>

          <div className="mb-4 grid grid-cols-[0.75fr_1.35fr_auto] items-center border-y border-slate-200 bg-white lg:mb-6 lg:flex lg:rounded-lg lg:border lg:px-4 lg:py-3">
            <div className="flex min-w-0 items-center lg:flex-1">
              <button
                onClick={() => setSideOpen(true)}
                className="flex h-11 w-full shrink-0 items-center justify-center gap-1 border-r border-slate-200 px-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 transition-colors hover:bg-slate-50 sm:gap-2 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 text-[#1572D3]" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1572D3] text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
                {selCats.map((category) => (
                  <span
                    key={category}
                    className="flex items-center gap-1 rounded-full border border-[#1572D3]/20 bg-[#E8F1FB] px-2.5 py-1 text-xs font-medium text-[#1572D3]"
                  >
                    {category}
                    <button onClick={() => toggleCat(category)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {selMakes.map((make) => (
                  <span
                    key={make}
                    className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                  >
                    {make}
                    <button onClick={() => toggleMake(make)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="contents lg:ml-auto lg:flex lg:shrink-0 lg:items-center lg:gap-2">
              <div className="relative">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="h-11 w-full cursor-pointer appearance-none border-r border-slate-200 bg-white py-2 pl-4 pr-7 text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1572D3] lg:h-auto lg:w-auto lg:rounded-lg lg:border lg:border-slate-200 lg:py-2 lg:pl-3 lg:pr-8 lg:text-sm lg:font-normal lg:normal-case lg:tracking-normal"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ArrowUpDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 sm:right-2.5" />
              </div>

              <div className="flex h-11 overflow-hidden lg:h-auto lg:rounded-lg lg:border lg:border-slate-200">
                <button
                  onClick={() => setView("grid")}
                  className={`flex h-11 w-11 items-center justify-center transition-colors lg:h-auto lg:w-auto lg:p-2 ${view === "grid" ? "bg-[#1572D3] text-white" : "text-slate-400 hover:bg-slate-100"}`}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`flex h-11 w-11 items-center justify-center transition-colors lg:h-auto lg:w-auto lg:p-2 ${view === "list" ? "bg-[#1572D3] text-white" : "text-slate-400 hover:bg-slate-100"}`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {paymentStatus && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm font-medium ${
                paymentStatus === "success"
                  ? "border-green-100 bg-green-50 text-green-700"
                  : "border-amber-100 bg-amber-50 text-amber-700"
              }`}
            >
              {paymentStatus === "success"
                ? `Payment received${paymentOrder ? ` for order ${paymentOrder}` : ""}.`
                : `Checkout was cancelled${paymentOrder ? ` for order ${paymentOrder}` : ""}.`}
            </div>
          )}

          {loading ? (
            <div className={view === "list" ? "flex flex-col gap-4 px-3 sm:px-0" : "grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-2 sm:gap-5 sm:bg-transparent xl:grid-cols-3 xl:gap-6"}>
              {[...Array(visibleCount)].map((_, index) => (
                <div key={index} className="h-72 animate-pulse rounded-lg bg-white" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white py-20 text-center">
              <h3 className="mb-1 text-lg font-semibold text-slate-800">
                No parts found
              </h3>
              <p className="mb-4 text-sm text-slate-500">
                Try adjusting your filters or search term.
              </p>
              <button
                onClick={clearAll}
                className="rounded-lg bg-[#1572D3] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0d5bb5]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={view === "list" ? "flex flex-col gap-4 px-3 sm:px-0" : "grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-2 sm:gap-5 sm:bg-transparent xl:grid-cols-3 xl:gap-6"}>
              {products.map((product) => (
                <ShopCard key={product.id} product={product} view={view} />
              ))}
            </div>
          )}

          {!loading && products.length > 0 && pagination?.hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + 6)}
                className="mt-4 rounded-lg border border-[#1572D3]/20 bg-white px-6 py-2.5 text-sm font-semibold text-[#1572D3] transition-colors hover:bg-[#E8F1FB]"
              >
                Load More
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
