import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useDispatch } from "react-redux";
import { asyncCurrentUser } from "./store/actions/appActions";
import IsAuthenticated from "./middleware/IsAuthenticated";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";

const HomePage = lazy(() => import("./pages/HomePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/auth/AdminLogin"));
const SignInBuyer = lazy(() => import("./pages/auth/SignInBuyer"));
const SignUpBuyer = lazy(() => import("./pages/auth/SignUpBuyer"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const WatchList = lazy(() => import("./pages/buyer/WatchList"));
const ShopPage = lazy(() => import("./pages/shop/ShopPage"));
const ProductDetail = lazy(() => import("./pages/shop/ProductDetail"));
const Profile = lazy(() => import("./pages/buyer/Profile"));

const PageLoader = () => (
  <div className="grid min-h-[60vh] place-items-center bg-slate-50 px-4 text-center">
    <div>
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#1572D3] border-t-transparent" />
      <p className="mt-4 text-sm font-semibold text-slate-500">
        Loading AutoCore...
      </p>
    </div>
  </div>
);

const App = () => {
  const dispatch = useDispatch();
  const [commerceDrawer, setCommerceDrawer] = useState(null);

  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    dispatch(asyncCurrentUser());
  }, [dispatch]);

  // Automatically scrolls to top whenever pathname changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = commerceDrawer ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [commerceDrawer]);

  useEffect(() => {
    if (!commerceDrawer) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") setCommerceDrawer(null);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [commerceDrawer]);

  return (
    <>
      {/* <ScrollToTop /> */}
      <div>
        {isAdminRoute ? (
          ""
        ) : (
          <Navbar
            onOpenCart={() => setCommerceDrawer("cart")}
            onOpenWishlist={() => setCommerceDrawer("wishlist")}
          />
        )}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" index element={<HomePage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/sign-in" element={<SignInBuyer />} />
            <Route path="/sign-up" element={<SignUpBuyer />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/product/:productId" element={<ProductDetail />} />
            <Route
              path="/admin/*"
              element={
                <IsAuthenticated requiredUserType="Admin">
                  <AdminDashboard />
                </IsAuthenticated>
              }
            />
            <Route path="/buyer" element={<HomePage />} />
            <Route
              path="/buyer/watch-list"
              element={
                <IsAuthenticated>
                  <WatchList />
                </IsAuthenticated>
              }
            />
            <Route
              path="/buyer/profile"
              element={
                <IsAuthenticated>
                  <Profile />
                </IsAuthenticated>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Wishlist
          open={commerceDrawer === "wishlist"}
          onClose={() => setCommerceDrawer(null)}
          onOpenCart={() => setCommerceDrawer("cart")}
        />
        <Cart
          open={commerceDrawer === "cart"}
          onClose={() => setCommerceDrawer(null)}
          onOpenWishlist={() => setCommerceDrawer("wishlist")}
        />
        {isAdminRoute ? "" : <Footer />}
      </div>
    </>
  );
};

export default App;
