import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Heart,
  List,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Truck,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, clearCart, setCartItems } from "../../store/slices/cartSlice";
import { setWishlistItems, toggleWishlist } from "../../store/slices/wishlistSlice";
import {
  getBrands,
  getCategories,
  getProducts,
  getVehicleEngines,
  normalizeProduct,
} from "../../services/catalogService";
import {
  addCartItem,
  addWishlistItem,
  canUseCommerceApi,
  removeWishlistItemRemote,
  syncStripeCheckoutSession,
} from "../../services/commerceService";
import { notifyError, notifySuccess } from "../../utils/Toast";

const SORT_OPTIONS = [
  { label: "Most Popular", value: "popular" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
];

const QUICK_CATEGORIES = [
  "Engine Parts",
  "Brake System",
  "Suspension",
  "Electrical",
  "Filters",
];

const PAGE_SIZE = 9;

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
  const dispatch = useDispatch();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState(params.get("keyword") || "");
  const [categorySearch, setCategorySearch] = useState("");
  const [selCats, setSelCats] = useState(() =>
    params.get("category") ? [params.get("category")] : []
  );
  const [selMakes, setSelMakes] = useState(() =>
    params.get("make") ? [params.get("make")] : []
  );
  const [selModels, setSelModels] = useState(() =>
    params.get("model") ? [params.get("model")] : []
  );
  const [year, setYear] = useState(params.get("year") || "");
  const [engineType, setEngineType] = useState(params.get("engineType") || "");
  const [engines, setEngines] = useState([]);
  const [engineLoading, setEngineLoading] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyOnSale, setOnlyOnSale] = useState(false);
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState("grid");
  const [sideOpen, setSideOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const lastFilterSignatureRef = useRef("");
  const paymentStatus = params.get("payment");
  const paymentOrder = params.get("order");
  const paymentSessionId = params.get("session_id");
  const [paymentVerification, setPaymentVerification] = useState({
    state: "idle",
    message: "",
  });

  useEffect(() => {
    if (paymentStatus !== "success") {
      setPaymentVerification({
        state: paymentStatus === "cancelled" ? "cancelled" : "idle",
        message:
          paymentStatus === "cancelled"
            ? `Checkout was cancelled${paymentOrder ? ` for order ${paymentOrder}` : ""}.`
            : "",
      });
      return;
    }

    let active = true;

    if (!paymentOrder || !paymentSessionId) {
      setPaymentVerification({
        state: "failed",
        message:
          "Stripe returned without verification details. Please check your Recent tab before trying again.",
      });
      notifyError("Payment could not be verified automatically.");
      return () => {
        active = false;
      };
    }

    if (!canUseCommerceApi()) {
      setPaymentVerification({
        state: "failed",
        message:
          "Sign in again to verify this payment and view the order in your Recent tab.",
      });
      return () => {
        active = false;
      };
    }

    setPaymentVerification({
      state: "verifying",
      message: `Verifying payment${paymentOrder ? ` for order ${paymentOrder}` : ""}...`,
    });

    syncStripeCheckoutSession({
      orderId: paymentOrder,
      sessionId: paymentSessionId,
    })
      .then((result) => {
        if (!active) return;
        if (
          result.order?.paymentStatus === "SUCCEEDED" ||
          result.paymentStatus === "paid"
        ) {
          dispatch(clearCart());
          dispatch(setCartItems(result.cart.items));
          setPaymentVerification({
            state: "verified",
            message: `Payment verified${paymentOrder ? ` for order ${paymentOrder}` : ""}.`,
          });
          notifySuccess(
            "Payment verified. You can view your product in the Recent tab."
          );
          return;
        }

        setPaymentVerification({
          state: "pending",
          message:
            "Stripe checkout returned, but payment is still pending. Please check your Recent tab shortly.",
        });
      })
      .catch((error) => {
        if (!active) return;
        setPaymentVerification({
          state: "failed",
          message:
            error?.response?.data?.message ||
            "Payment could not be verified yet. Please check your Recent tab before trying again.",
        });
        notifyError("Payment verification failed. Please check your Recent tab.");
      });

    return () => {
      active = false;
    };
  }, [dispatch, paymentOrder, paymentSessionId, paymentStatus]);

  const activeFilterCount =
    selCats.length +
    selMakes.length +
    selModels.length +
    (year ? 1 : 0) +
    (engineType ? 1 : 0) +
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
  const resultSummary = loading
    ? "Loading verified parts..."
    : `${pagination?.total || products.length} part${(pagination?.total || products.length) === 1 ? "" : "s"} found`;
  const filterSignature = useMemo(
    () =>
      JSON.stringify({
        keyword,
        category: selCats[0] || "",
        make: selMakes[0] || "",
        model: selModels[0] || "",
        year,
        engineType,
        minPrice,
        maxPrice,
        onlyInStock,
        onlyOnSale,
        sort,
      }),
    [
      keyword,
      engineType,
      maxPrice,
      minPrice,
      onlyInStock,
      onlyOnSale,
      selCats,
      selMakes,
      selModels,
      sort,
      year,
    ]
  );
  const selectedBrand = useMemo(
    () =>
      brands.find(
        (brand) =>
          brand.name === selMakes[0] || brand.slug === selMakes[0] || brand.id === selMakes[0]
      ),
    [brands, selMakes]
  );
  const availableModels = useMemo(
    () => selectedBrand?.models || [],
    [selectedBrand]
  );
  const selectedModel = useMemo(
    () =>
      availableModels.find(
        (model) =>
          model.name === selModels[0] || model.slug === selModels[0] || model.id === selModels[0]
      ),
    [availableModels, selModels]
  );
  const engineOptions = useMemo(
    () =>
      Array.from(
        new Set(
          engines
            .map((engine) => engine.engineType)
            .filter(Boolean)
        )
      ),
    [engines]
  );
  const filteredCategories = useMemo(() => {
    const term = categorySearch.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) =>
      String(category.name || "").toLowerCase().includes(term)
    );
  }, [categories, categorySearch]);

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
    setSelModels(params.get("model") ? [params.get("model")] : []);
    setYear(params.get("year") || "");
    setEngineType(params.get("engineType") || "");
  }, [params]);

  useEffect(() => {
    if (!selectedModel) {
      setEngines([]);
      return;
    }

    let active = true;
    setEngineLoading(true);
    getVehicleEngines(selectedModel.id || selectedModel.slug || selectedModel.name)
      .then((nextEngines) => {
        if (active) setEngines(nextEngines);
      })
      .catch(() => {
        if (active) setEngines([]);
      })
      .finally(() => {
        if (active) setEngineLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedModel]);

  useEffect(() => {
    let active = true;
    const filtersChanged = lastFilterSignatureRef.current !== filterSignature;
    const nextPage = filtersChanged ? 1 : page;

    if (filtersChanged) {
      lastFilterSignatureRef.current = filterSignature;
      if (page !== 1) {
        setProducts([]);
        setPagination(null);
        setPage(1);
        return () => {
          active = false;
        };
      }
    }

    const timer = window.setTimeout(() => {
      if (nextPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError("");
      getProducts({
        page: nextPage,
        limit: PAGE_SIZE,
        keyword,
        category: selCats[0],
        make: selMakes[0],
        model: selModels[0],
        year,
        engineType,
        minPrice,
        maxPrice,
        inStock: onlyInStock ? "true" : "",
        onSale: onlyOnSale ? "true" : "",
        sort,
      })
        .then(({ products: nextProducts, pagination: nextPagination }) => {
          if (!active) return;
          setProducts((currentProducts) => {
            if (nextPage === 1) return nextProducts;
            const seen = new Set(currentProducts.map((product) => product.id));
            const uniqueNext = nextProducts.filter((product) => !seen.has(product.id));
            return [...currentProducts, ...uniqueNext];
          });
          setPagination(nextPagination);
        })
        .catch(() => {
          if (!active) return;
          setProducts([]);
          setPagination(null);
          setError("Could not load parts right now. Check that the backend is running.");
        })
        .finally(() => {
          if (!active) return;
          setLoading(false);
          setLoadingMore(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    filterSignature,
    keyword,
    engineType,
    maxPrice,
    minPrice,
    onlyInStock,
    onlyOnSale,
    selCats,
    selMakes,
    selModels,
    sort,
    year,
    page,
  ]);

  const toggleCat = (category) =>
    setSelCats((items) => (items.includes(category) ? [] : [category]));
  const selectMake = (make) => {
    setSelMakes(make ? [make] : []);
    setSelModels([]);
    setEngineType("");
  };
  const selectModel = (model) => {
    setSelModels(model ? [model] : []);
    setEngineType("");
  };
  const clearAll = () => {
    setKeyword("");
    setCategorySearch("");
    setSelCats([]);
    setSelMakes([]);
    setSelModels([]);
    setYear("");
    setEngineType("");
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
            Search Categories
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder="Filter categories..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1572D3]"
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            This filters the category list only.
          </p>
        </div>

        <div className="border-y border-slate-100 py-3">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-slate-700">
            Category
          </h3>
          <div className="max-h-36 space-y-2 overflow-y-auto pr-1 shop-filter-scroll">
            {filterLoading && (
              <p className="text-sm text-slate-400">Loading categories...</p>
            )}
            {filteredCategories.map((category) => (
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
            {!filterLoading && filteredCategories.length === 0 && (
              <p className="text-sm text-slate-400">No categories found.</p>
            )}
          </div>
        </div>
      </div>

      <SideSection title="Vehicle Fitment">
        <div className="space-y-3">
          {filterLoading && <p className="text-sm text-slate-400">Loading vehicles...</p>}
          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-400">
              Make
            </span>
            <select
              value={selMakes[0] || ""}
              onChange={(event) => selectMake(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
            >
              <option value="">Any make</option>
              {brands.map((brand) => (
                <option key={brand.id || brand.name} value={brand.name}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-400">
              Model
            </span>
            <select
              value={selModels[0] || ""}
              onChange={(event) => selectModel(event.target.value)}
              disabled={!selMakes[0]}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#1572D3] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {selMakes[0] ? "Any model" : "Select make first"}
              </option>
              {availableModels.map((model) => (
                <option key={model.id || model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-400">
              Year
            </span>
            <input
              type="number"
              min="1900"
              max="2100"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder="e.g. 2018"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-400">
              Engine Type
            </span>
            <select
              value={engineType}
              onChange={(event) => setEngineType(event.target.value)}
              disabled={!selModels[0] || engineLoading}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#1572D3] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {engineLoading
                  ? "Loading engines..."
                  : selModels[0]
                    ? "Any engine"
                    : "Select model first"}
              </option>
              {engineOptions.map((engine) => (
                <option key={engine} value={engine}>
                  {engine}
                </option>
              ))}
            </select>
          </label>
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

          <section className="mb-4 overflow-hidden border-y border-slate-200 bg-white px-4 py-5 sm:rounded-lg sm:border sm:px-6 lg:mb-6 lg:px-7 lg:py-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1572D3]">
                  AutoCore Shop
                </p>
                <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-950 sm:text-3xl lg:text-4xl">
                  Find verified parts for your next repair
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Browse OEM-quality spare parts, filter by make, model, year,
                  and engine type, then add items to your cart or wishlist without
                  leaving the catalog.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                  Search products
                </label>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-[#1572D3]" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Part name, SKU, or part number"
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none"
                  />
                  {keyword && (
                    <button
                      type="button"
                      onClick={() => setKeyword("")}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Product search supports multiple words from the same product name.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {QUICK_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCat(category)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      selCats.includes(category)
                        ? "border-[#1572D3] bg-[#E8F1FB] text-[#1572D3]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-[#1572D3]/40 hover:text-[#1572D3]"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 sm:flex sm:items-center sm:gap-3">
                <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#1572D3]" />
                  Verified
                </span>
                <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 font-medium">
                  <PackageCheck className="h-3.5 w-3.5 text-[#1572D3]" />
                  Stocked
                </span>
                <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 font-medium">
                  <Truck className="h-3.5 w-3.5 text-[#1572D3]" />
                  Dispatch
                </span>
              </div>
            </div>
          </section>

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
                <span className="mr-2 text-sm font-semibold text-slate-700">
                  {resultSummary}
                </span>
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
                    <button onClick={() => selectMake("")}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {selModels.map((model) => (
                  <span
                    key={model}
                    className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                  >
                    {model}
                    <button onClick={() => selectModel("")}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {year && (
                  <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {year}
                    <button onClick={() => setYear("")}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {engineType && (
                  <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    {engineType}
                    <button onClick={() => setEngineType("")}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
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

          {paymentStatus && paymentVerification.state !== "idle" && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm font-medium ${
                paymentVerification.state === "verified"
                  ? "border-green-100 bg-green-50 text-green-700"
                  : paymentVerification.state === "failed"
                    ? "border-red-100 bg-red-50 text-red-700"
                    : paymentVerification.state === "verifying"
                      ? "border-blue-100 bg-blue-50 text-blue-700"
                      : "border-amber-100 bg-amber-50 text-amber-700"
              }`}
            >
              {paymentVerification.message}
            </div>
          )}

          {loading ? (
            <div className={view === "list" ? "flex flex-col gap-4 px-3 sm:px-0" : "grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-2 sm:gap-5 sm:bg-transparent xl:grid-cols-3 xl:gap-6"}>
              {[...Array(PAGE_SIZE)].map((_, index) => (
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
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={loadingMore}
                className="mt-4 rounded-lg border border-[#1572D3]/20 bg-white px-6 py-2.5 text-sm font-semibold text-[#1572D3] transition-colors hover:bg-[#E8F1FB] disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
