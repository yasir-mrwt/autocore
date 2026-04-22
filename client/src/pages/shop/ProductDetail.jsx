import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, setCartItems } from "../../store/slices/cartSlice";
import { setWishlistItems, toggleWishlist } from "../../store/slices/wishlistSlice";
import {
  getProduct,
  getRelatedProducts,
  normalizeProduct,
} from "../../services/catalogService";
import {
  addCartItem,
  addWishlistItem,
  canUseCommerceApi,
  getOrders,
  removeWishlistItemRemote,
} from "../../services/commerceService";
import { addRecentlyViewed } from "../../services/recentlyViewedService";
import {
  deleteProductReview,
  getProductReviews,
  saveProductReview,
} from "../../services/reviewService";

const getDiscount = (product) =>
  product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.discount || 0;

const RelatedCard = ({ product }) => {
  const item = normalizeProduct(product);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishItems = useSelector((state) => state.wishlist?.items || []);
  const user = useSelector((state) => state.app?.user);
  const isWished = wishItems.some((wishItem) => wishItem.id === item.id);
  const discount = getDiscount(item);

  const onCart = (event) => {
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
          {discount > 0 ? (
            <span className="rounded-md bg-[#1572D3] px-2 py-0.5 text-[10px] font-bold text-white">
              -{discount}%
            </span>
          ) : (
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

const ProductDetail = () => {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [stickyBar, setStickyBar] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(true);
  const [fitmentOpen, setFitmentOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const imageRefs = useRef([]);
  const desktopDetailsRef = useRef(null);
  const mobileDetailsRef = useRef(null);
  const wishItems = useSelector((state) => state.wishlist?.items || []);
  const user = useSelector((state) => state.app?.user);
  const isWished = product
    ? wishItems.some((wishItem) => wishItem.id === product.id)
    : false;

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setActiveImage(0);
    Promise.all([getProduct(productId), getRelatedProducts(productId, { limit: 8 })])
      .then(([nextProduct, nextRelated]) => {
        if (!active) return;
        setProduct(nextProduct);
        setRecommendations(nextRelated);
      })
      .catch(() => {
        if (!active) return;
        setError("Could not load this product. Please try another part.");
        setProduct(null);
        setRecommendations([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!product) return undefined;

    const userId = user?.id || user?._id || "guest";
    addRecentlyViewed(userId, product);
  }, [product, user]);

  useEffect(() => {
    if (!product) return undefined;

    let active = true;
    setReviewsLoading(true);
    setReviewMessage("");

    getProductReviews(product.slug || product.id)
      .then((nextReviews) => {
        if (active) setReviews(nextReviews);
      })
      .catch(() => {
        if (active) setReviewMessage("Could not load reviews right now.");
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });

    if (canUseCommerceApi()) {
      getOrders()
        .then((orders) => {
          if (!active) return;
          const bought = orders.some(
            (order) =>
              order.paymentStatus === "SUCCEEDED" &&
              !["CANCELLED", "REFUNDED"].includes(order.status) &&
              (order.items || []).some((item) => item.productId === product.id)
          );
          setCanReview(bought);
        })
        .catch(() => {
          if (active) setCanReview(false);
        });
    } else {
      setCanReview(false);
    }

    return () => {
      active = false;
    };
  }, [product]);

  useEffect(() => {
    const userId = user?.id || user?._id;
    const ownReview = reviews.find((review) => review.customer?.id === userId);

    if (!ownReview) return;
    setReviewRating(ownReview.rating || 5);
    setReviewTitle(ownReview.title || "");
    setReviewComment(ownReview.comment || "");
  }, [reviews, user]);

  useEffect(() => {
    if (!product) return undefined;

    const observers = [];
    imageRefs.current.forEach((node, index) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveImage(index);
        },
        { threshold: 0.55 }
      );
      observer.observe(node);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [product]);

  useEffect(() => {
    if (!product) return undefined;

    const onScroll = () => {
      const detailsNode =
        window.innerWidth >= 1024 ? desktopDetailsRef.current : mobileDetailsRef.current;
      if (!detailsNode) {
        setStickyBar(false);
        return;
      }

      const navOffset = window.innerWidth >= 1024 ? 82 : 68;
      setStickyBar(detailsNode.getBoundingClientRect().top <= navOffset);
    };

    onScroll();
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-10 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[80px_minmax(420px,1fr)_420px]">
          <div className="hidden space-y-5 lg:block">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-20 w-14 animate-pulse bg-slate-100" />
            ))}
          </div>
          <div className="h-[520px] animate-pulse bg-slate-100" />
          <div className="space-y-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-7 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] bg-white px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Product not found</h1>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  const discount = getDiscount(product);
  const productImages = product.images.length ? product.images : [product.image];
  const compatibilityLabels = product.compatibilities
    .slice(0, 4)
    .map((item) =>
      [
        item.brand?.name,
        item.model?.name,
        item.yearFrom && item.yearTo ? `${item.yearFrom}-${item.yearTo}` : null,
        item.engineType,
      ]
        .filter(Boolean)
        .join(" ")
    );
  const currentUserId = user?.id || user?._id;
  const ownReview = reviews.find((review) => review.customer?.id === currentUserId);

  const cartPayload = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    qty: quantity,
    stock: product.stock || 50,
  };

  const addProductToCart = () => {
    dispatch(addToCart(cartPayload));

    if (canUseCommerceApi()) {
      addCartItem({
        productId: product.slug || product.id,
        quantity,
      })
        .then((cart) => dispatch(setCartItems(cart.items)))
        .catch(() => {});
    }
  };
  const toggleProductWish = () => {
    dispatch(
      toggleWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      })
    );

    if (canUseCommerceApi()) {
      const request = isWished
        ? removeWishlistItemRemote(product.remoteItemId || product.slug || product.id)
        : addWishlistItem(product.slug || product.id);

      request
        .then((wishlist) => dispatch(setWishlistItems(wishlist.items)))
        .catch(() => {});
    }
  };

  const openViewer = (index = activeImage) => {
    setActiveImage(index);
    setViewerOpen(true);
  };

  const moveViewer = (direction) => {
    setActiveImage((index) => {
      const next = index + direction;
      if (next < 0 || next >= productImages.length) return index;
      return next;
    });
  };

  const updateProductRating = (ratingSummary) => {
    if (!ratingSummary) return;

    setProduct((current) =>
      current
        ? {
            ...current,
            rating: Math.round(Number(ratingSummary.averageRating || 0)),
            reviews: Number(ratingSummary.reviewCount || 0),
            averageRating: Number(ratingSummary.averageRating || 0),
            reviewCount: Number(ratingSummary.reviewCount || 0),
          }
        : current
    );
  };

  const submitReview = async () => {
    if (!canUseCommerceApi()) {
      setReviewMessage("Please sign in before reviewing this part.");
      return;
    }

    setReviewSaving(true);
    setReviewMessage("");

    try {
      const data = await saveProductReview(product.slug || product.id, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      const nextReviews = await getProductReviews(product.slug || product.id);
      setReviews(nextReviews);
      updateProductRating(data.productRating);
      setReviewMessage("Review saved successfully.");
    } catch (error) {
      setReviewMessage(
        error?.response?.data?.message || "Could not save your review."
      );
    } finally {
      setReviewSaving(false);
    }
  };

  const removeReview = async (reviewId) => {
    setReviewSaving(true);
    setReviewMessage("");

    try {
      const data = await deleteProductReview(reviewId);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
      updateProductRating(data.productRating);
      setReviewTitle("");
      setReviewComment("");
      setReviewRating(5);
      setReviewMessage("Review deleted successfully.");
    } catch (error) {
      setReviewMessage(
        error?.response?.data?.message || "Could not delete your review."
      );
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <div className="bg-white text-slate-950">
      {stickyBar && (
        <div className="fixed left-0 right-0 top-[68px] z-[90] border-b border-slate-100 bg-white px-4 py-3 shadow-sm lg:top-[82px] lg:px-8">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <img
                src={product.image}
                alt={product.name}
                className="hidden h-16 w-16 object-contain sm:block"
              />
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-[0.18em] text-slate-950 sm:tracking-[0.28em]">
                  {product.name}
                </p>
                <p className="mt-1 text-sm tracking-[0.12em] text-red-500 sm:tracking-[0.28em]">
                  {discount > 0 && `-${discount}% `}
                  Rs {product.price.toLocaleString()}
                  {product.originalPrice && (
                    <span className="ml-2 text-slate-400 line-through sm:ml-3">
                      Rs {product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={toggleProductWish}
                className={`grid h-10 w-10 place-items-center border transition-colors sm:h-11 sm:w-11 ${isWished ? "border-[#1572D3]/20 bg-[#E8F1FB] text-[#1572D3]" : "border-slate-200 bg-white text-slate-500 hover:text-[#1572D3]"}`}
                aria-label="Add to wishlist"
              >
                <Heart className="h-4 w-4" fill={isWished ? "currentColor" : "none"} />
              </button>
              <button
                onClick={addProductToCart}
                className="bg-[#1b1b1b] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white sm:px-8 sm:tracking-[0.3em]"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="hidden grid-cols-[80px_minmax(420px,1fr)_420px] gap-8 px-12 py-12 lg:grid">
        <div className="sticky top-24 h-fit space-y-5">
          {productImages.map((image, index) => (
            <button
              key={image + index}
              onClick={() => {
                imageRefs.current[index]?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                setActiveImage(index);
              }}
              className={`h-20 w-14 border bg-[#F7FBFF] ${activeImage === index ? "border-slate-950" : "border-transparent"}`}
            >
              <img src={image} alt="" className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>

        <div className="space-y-10">
          {productImages.map((image, index) => (
            <button
              key={image + index}
              ref={(node) => (imageRefs.current[index] = node)}
              onClick={() => openViewer(index)}
              className="relative block h-[620px] w-full bg-[#F7FBFF]"
            >
              {index === 0 && (
                <span className="absolute left-6 top-5 text-[11px] uppercase tracking-[0.28em]">
                  AutoCore Verified
                </span>
              )}
              <img src={image} alt={product.name} className="h-full w-full object-contain p-8" />
            </button>
          ))}
        </div>

        <aside className="sticky top-24 h-fit">
          <p className="text-sm uppercase tracking-[0.28em]">{product.name}</p>
          <p className="mt-7 text-sm uppercase tracking-wide">{product.subtitle}</p>
          <p className="mt-7 text-sm text-slate-500">
            SKU: {product.sku || product.partNumber}
          </p>
          <p className="mt-5 text-lg tracking-[0.28em] text-red-500">
            {discount > 0 && `-${discount}% `}
            Rs {product.price.toLocaleString()}
            {product.originalPrice && (
              <span className="ml-4 text-sm text-slate-400 line-through">
                Rs {product.originalPrice.toLocaleString()}
              </span>
            )}
          </p>
          <p className="mt-7 text-sm uppercase tracking-wide">
            {product.inStock ? "In Stock" : "Out of Stock"}
          </p>
          <p className="mt-5 text-sm">Category: {product.category}</p>
          <div className="mt-3 inline-flex border border-slate-950 px-5 py-3 text-sm uppercase">
            {product.fabric}
          </div>

          <div className="mt-8 flex gap-3">
            <div className="grid w-32 grid-cols-3 border border-slate-200">
              <button
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="grid place-items-center"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="grid place-items-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((value) => value + 1)}
                className="grid place-items-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={addProductToCart}
              disabled={!product.inStock}
              className="flex-1 bg-[#1b1b1b] py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:bg-slate-300"
            >
              Add to Cart
            </button>
          </div>

          <div className="mt-8 border border-slate-950 p-5 text-center text-sm">
            <strong>Free shipping</strong> is only <strong>Rs 7,000</strong> away!
            <div className="mt-5 h-2 rounded-full bg-slate-200">
              <div className="h-full w-[72%] rounded-full bg-slate-400" />
            </div>
          </div>

          <div ref={desktopDetailsRef} className="mt-8 border-t border-slate-200 py-5">
            <button
              onClick={() => setDescriptionOpen((value) => !value)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-xs uppercase tracking-[0.28em]">Description</span>
              {descriptionOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
            {descriptionOpen && (
              <div className="mt-5">
                <p className="text-sm leading-6 text-slate-600">
                  {product.description || product.subtitle}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.details.map((item) => (
                    <span key={item} className="border border-slate-200 px-3 py-2 text-xs text-slate-500">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 py-5">
            <button
              onClick={() => setFitmentOpen((value) => !value)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-xs uppercase tracking-[0.28em]">Fitment & Care</span>
              {fitmentOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
            {fitmentOpen && (
              <div className="mt-5 space-y-2 text-sm text-slate-600">
                {(compatibilityLabels.length ? compatibilityLabels : ["Check your vehicle model and part number before checkout."]).map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleProductWish}
            className="mt-2 flex items-center gap-2 text-sm text-slate-600"
          >
            <Heart className="h-4 w-4" fill={isWished ? "currentColor" : "none"} />
            Wishlist
          </button>
        </aside>
      </section>

      <section className="lg:hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto product-detail-mobile-gallery">
          {productImages.map((image, index) => (
            <div key={image + index} className="relative min-w-full snap-center bg-[#F7FBFF]">
              <span className="absolute left-4 top-4 text-[9px] uppercase tracking-[0.25em]">
                AutoCore Verified
              </span>
              <button
                onClick={() => openViewer(index)}
                className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white shadow"
              >
                <Plus className="h-4 w-4" />
              </button>
              <img src={image} alt={product.name} className="h-[440px] w-full object-contain p-5" />
            </div>
          ))}
        </div>

        <div className="px-3 py-5">
          <p className="text-xs uppercase tracking-[0.28em]">{product.name}</p>
          <p className="mt-5 text-sm uppercase tracking-wide">{product.subtitle}</p>
          <p className="mt-5 text-sm text-slate-500">
            SKU: {product.sku || product.partNumber}
          </p>
          <p className="mt-4 text-base tracking-[0.2em] text-red-500">
            {discount > 0 && `-${discount}% `}
            Rs {product.price.toLocaleString()}
            {product.originalPrice && (
              <span className="ml-3 text-xs text-slate-400 line-through">
                Rs {product.originalPrice.toLocaleString()}
              </span>
            )}
          </p>
          <p className="mt-6 text-sm uppercase tracking-wide">
            {product.inStock ? "In Stock" : "Out of Stock"}
          </p>
          <p className="mt-5 text-sm">Category: {product.category}</p>
          <div className="mt-3 inline-flex border border-slate-950 px-4 py-3 text-xs uppercase">
            {product.fabric}
          </div>

          <div className="mt-7 flex gap-2">
            <div className="grid w-24 grid-cols-3 border border-slate-200">
              <button
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="grid place-items-center"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="grid place-items-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((value) => value + 1)}
                className="grid place-items-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={addProductToCart}
              disabled={!product.inStock}
              className="flex-1 bg-[#1b1b1b] py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white disabled:bg-slate-300"
            >
              Add to Cart
            </button>
          </div>

          <div className="mt-7 border border-slate-950 p-4 text-center text-sm">
            <strong>Free shipping</strong> is only <strong>Rs 7,000</strong> away!
            <div className="mt-5 h-2 rounded-full bg-slate-200">
              <div className="h-full w-[72%] rounded-full bg-slate-400" />
            </div>
          </div>

          <div ref={mobileDetailsRef} className="mt-6 border-t border-slate-200 py-5">
            <button
              onClick={() => setDescriptionOpen((value) => !value)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-xs uppercase tracking-[0.28em]">Description</span>
              {descriptionOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
            {descriptionOpen && (
              <div className="mt-5">
                <p className="text-sm leading-6 text-slate-600">
                  {product.description || product.subtitle}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.details.map((item) => (
                    <span key={item} className="border border-slate-200 px-3 py-2 text-xs text-slate-500">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 py-5">
            <button
              onClick={() => setFitmentOpen((value) => !value)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-xs uppercase tracking-[0.28em]">Fitment & Care</span>
              {fitmentOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
            {fitmentOpen && (
              <div className="mt-5 space-y-2 text-sm text-slate-600">
                {(compatibilityLabels.length ? compatibilityLabels : ["Check your vehicle model and part number before checkout."]).map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 px-3 py-12 lg:px-12">
        <div className="mx-auto grid max-w-[1280px] gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#1572D3]">
              Reviews
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Customer ratings
            </h2>
            <div className="mt-4 flex items-center gap-2">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className="h-5 w-5"
                  fill={index < product.rating ? "#F59E0B" : "none"}
                  stroke={index < product.rating ? "#F59E0B" : "#CBD5E1"}
                />
              ))}
              <span className="text-sm font-semibold text-slate-600">
                {product.reviews || 0} reviews
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
              Reviews are available only for customers with a paid order for this part.
            </p>

            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="font-bold text-slate-950">
                {ownReview ? "Update your review" : "Write a review"}
              </h3>
              <div className="mt-4 flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReviewRating(value)}
                    className="rounded-lg p-1 text-amber-500"
                    aria-label={`${value} star rating`}
                  >
                    <Star
                      className="h-6 w-6"
                      fill={value <= reviewRating ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={reviewTitle}
                onChange={(event) => setReviewTitle(event.target.value)}
                placeholder="Review title"
                className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
              />
              <textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Share your fitment, quality, or delivery experience"
                rows={4}
                className="mt-3 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
              />
              {reviewMessage && (
                <p className="mt-3 rounded-lg bg-[#F7FBFF] px-3 py-2 text-xs font-medium text-slate-600">
                  {reviewMessage}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={reviewSaving || !canReview}
                  className="rounded-lg bg-[#1572D3] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0d5bb5] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {reviewSaving ? "Saving..." : ownReview ? "Update Review" : "Submit Review"}
                </button>
                {ownReview && (
                  <button
                    type="button"
                    onClick={() => removeReview(ownReview.id)}
                    disabled={reviewSaving}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>
              {!canReview && (
                <p className="mt-3 text-xs text-slate-400">
                  Buy this part through AutoCore before leaving a review.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            {reviewsLoading ? (
              <div className="grid min-h-56 place-items-center text-sm font-semibold text-slate-400">
                Loading reviews...
              </div>
            ) : reviews.length ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-950">
                          {review.title || "Product review"}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {review.customer?.name || "AutoCore Customer"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className="h-4 w-4"
                            fill={index < review.rating ? "#F59E0B" : "none"}
                            stroke={index < review.rating ? "#F59E0B" : "#CBD5E1"}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {review.comment}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid min-h-56 place-items-center text-center">
                <div>
                  <Star className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-3 font-bold text-slate-950">
                    No reviews yet
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Purchased customer reviews will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-0 pb-16 pt-10 lg:px-12 lg:pt-16">
        <h2 className="text-center text-2xl uppercase tracking-[0.45em] lg:text-3xl">
          You May Also Like
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-2 sm:gap-5 sm:bg-transparent lg:mt-12 xl:grid-cols-3 xl:gap-6">
          {recommendations.map((item) => (
            <RelatedCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      {viewerOpen && (
        <div className="fixed inset-0 z-[220] bg-white">
          <img
            src={productImages[activeImage]}
            alt={product.name}
            className="mx-auto h-full max-h-screen w-full max-w-3xl object-contain"
          />
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-5">
            <button
              onClick={() => moveViewer(-1)}
              disabled={activeImage === 0}
              className="grid h-12 w-12 place-items-center rounded-full bg-white shadow disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewerOpen(false)}
              className="grid h-14 w-14 place-items-center rounded-full bg-white shadow"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              onClick={() => moveViewer(1)}
              disabled={activeImage === productImages.length - 1}
              className="grid h-12 w-12 place-items-center rounded-full bg-white shadow disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
