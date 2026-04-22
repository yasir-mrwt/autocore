import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { NavItems } from "../../constants";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "/assets/image/Avatar.png";
import {
  Camera,
  Clock3,
  Heart,
  LockKeyhole,
  LogOut,
  Mail,
  Phone,
  Save,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import {
  asyncChangePassword,
  asyncLogOut,
  asyncUpdateProfile,
} from "../store/actions/appActions";
import { Tooltip } from "@mui/material";
import { notifyError, notifySuccess } from "../utils/Toast";
import { Menu, X } from "lucide-react";

const Navbar = ({ onOpenCart, onOpenWishlist }) => {
  const navRef = useRef(null);
  const { pathname, search } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [profileImage, setProfileImage] = useState(Avatar);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const { isAuthenticated, user } = useSelector((state) => state.app);
  const cartItems = useSelector((state) => state.cart?.items || []);
  const wishItems = useSelector((state) => state.wishlist?.items || []);

  const cartCount = cartItems.reduce(
    (sum, item) => sum + Number(item.qty || item.quantity || 1),
    0
  );
  const wishCount = wishItems.length;
  const isShopPage = pathname.startsWith("/shop");
  const shopCategory = new URLSearchParams(search).get("category");
  const shopTitle = shopCategory || "All Spare Parts";
  const mobilePartCategories = [
    "Engine Parts",
    "Brake System",
    "Suspension",
    "Electrical",
    "Filters",
    "Body Parts",
    "Transmission",
    "Cooling System",
  ];
  const navWidthClass = "w-full max-w-[1180px] mx-auto";

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const dropdownRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    setProfileForm({
      name: user?.name || user?.user_name || "",
      phone: user?.phone || "",
    });
    const storedAvatar = user?.id
      ? localStorage.getItem(`autocore_profile_image_${user.id}`)
      : "";
    setProfileImage(storedAvatar || Avatar);
  }, [user]);

  const handleLogout = async () => {
    const res = await dispatch(asyncLogOut("Buyer"));

    if (res == 200) notifySuccess("Logged out successfully!");
    else notifyError("Error logging out!");

    setAvatarOpen(false);
    setIsMenuOpen(false);
  };

  const openProfileOverlay = () => {
    setAvatarOpen(true);
    setIsMenuOpen(false);
  };

  const closeProfileOverlay = () => {
    setAvatarOpen(false);
    setPasswordForm({ currentPassword: "", newPassword: "" });
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    const res = await dispatch(asyncUpdateProfile(profileForm, "Buyer"));
    setProfileSaving(false);

    if (res?.status) {
      notifyError(res.message || "Could not update profile.");
      return;
    }

    notifySuccess("Profile updated successfully.");
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = String(reader.result || "");
      setProfileImage(imageUrl);
      if (user?.id) {
        localStorage.setItem(`autocore_profile_image_${user.id}`, imageUrl);
      }
      notifySuccess("Profile image updated.");
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordSave = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      notifyError("Please enter current and new password.");
      return;
    }

    setPasswordSaving(true);
    const res = await dispatch(asyncChangePassword(passwordForm, "Buyer"));
    setPasswordSaving(false);

    if (res?.status) {
      notifyError(res.message || "Could not change password.");
      return;
    }

    closeProfileOverlay();
    notifySuccess("Password changed. Please sign in again.");
    navigate("/sign-in");
  };

  const iconLinkClass =
    "relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-all hover:bg-gray-100 hover:text-[#1572D3]";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        navRef.current &&
        !navRef.current.contains(event.target) &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (event.target.id == "avatar") return;
        setAvatarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        const navHeight = navRef.current.offsetHeight;
        const scrollY = window.scrollY;
        const scrollThreshold = navHeight * 0.1;

        if (scrollY >= scrollThreshold) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      }
    };

    handleScroll(); // Call initially to check if the page is already scrolled
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    // <div className="relative w-full bg-white">
    <div
      // className="container flex items-center justify-between py-2"

      className={`${["/", "/buyer"].includes(pathname) ? "fixed" : "sticky"
        } top-0 left-0 w-full z-[100]`}
      // className=" sticky top-0 left-0 w-full z-[100]"
      style={{
        backgroundColor: isScrolled ? "white" : "",
        boxShadow: isScrolled ? "0px 2px 0px rgba(0, 0, 0, .2)" : "",
        transition: ".3s all",
      }}
    >
      <nav
        ref={navRef}
        className={`${navWidthClass} 2xl:relative flex min-h-[68px] items-center justify-between px-4 sm:px-5 lg:min-h-[82px] lg:px-8 dark:bg-gray-500`}
      // className="container 2xl:relative  py-5 flex items-center justify-between px-3 dark:bg-gray-500"
      >
        <div className="relative flex w-full items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={toggleMenu}
            className="flex h-9 w-9 items-center justify-center text-slate-900"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link
            to="/"
            className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2"
          >
            <Logo />
            <h1 className="text-base font-semibold text-[#1572D3]">
              AutoCore
            </h1>
          </Link>

          <div className="flex items-center gap-1">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => navigate("/buyer/watch-list")}
                className="relative flex h-9 w-9 items-center justify-center text-slate-900"
                aria-label="Recently viewed and orders"
              >
                <Clock3 className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenWishlist}
              className="relative flex h-9 w-9 items-center justify-center text-slate-900"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishCount > 0 && (
                <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-pink-500" />
              )}
            </button>
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex h-9 w-9 items-center justify-center text-slate-900"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#1572D3]" />
              )}
            </button>
          </div>
        </div>

        <div className="hidden lg:block">
          {isShopPage ? (
            <>
              <div className="min-w-[230px]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Link to="/" className="transition-colors hover:text-[#1572D3]">
                    Home
                  </Link>
                  <span>/</span>
                  <span className="font-medium text-slate-800">Shop Parts</span>
                </div>
                <h1 className="mt-0.5 text-base font-semibold text-slate-950">
                  {shopTitle}
                </h1>
              </div>
              <Link
                to="/"
                className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3"
              >
                <Logo />
                <h1 className="text-base font-semibold text-[#1572D3]">
                  AutoCore
                </h1>
              </Link>
            </>
          ) : (
            <Link to="/">
              <div className=" flex items-center gap-3">
                <Logo />

                <h1 className=" text-base text-[#1572D3] font-semibold">
                  AutoCore
                </h1>
              </div>
            </Link>
          )}
        </div>
        <div className={isShopPage ? "hidden" : "hidden lg:block"}>
          <ul className="inline-flex space-x-8">
            {NavItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  className={` text-sm font-semibold text-gray-800 hover:text-gray-900`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to={`/?why-choose-us`}
                className="text-sm font-semibold text-gray-800 hover:text-gray-900"
              >
                Why choose us
              </Link>
            </li>
            <li>
              <Link
                to={`/?testimonials`}
                className="text-sm font-semibold text-gray-800 hover:text-gray-900"
              >
                Testimonials
              </Link>
            </li>
          </ul>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <Tooltip title={"Wishlist"} arrow>
            <button
              type="button"
              onClick={onOpenWishlist}
              className={iconLinkClass}
              aria-label="Wishlist"
            >
              <Heart size={22} />
              {wishCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white">
                  {wishCount > 9 ? "9+" : wishCount}
                </span>
              )}
            </button>
          </Tooltip>
          <Tooltip title={"Cart"} arrow>
            <button
              type="button"
              onClick={onOpenCart}
              className={iconLinkClass}
              aria-label="Cart"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1572D3] px-1 text-[9px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          </Tooltip>
          {isAuthenticated ? (
            <div className="flex gap-6 bg-white px-5 py-2 rounded-full items-center relative shadow-lg">
              <Tooltip title={"Recently Viewed"} arrow>
                <Clock3
                  onClick={() => {
                    navigate("/buyer/watch-list");
                  }}
                  size={24}
                  className="text-gray-500 hover:text-[#1572D3] cursor-pointer transition-all"
                />
              </Tooltip>
              <button
                type="button"
                onClick={openProfileOverlay}
                className="rounded-full"
                aria-label="Open profile"
              >
                <img
                  id="avatar"
                  src={profileImage}
                  alt="Avatar"
                  className=" object-cover"
                />
              </button>
            </div>
          ) : (
            <div className=" space-x-4">
              <Link
                to={`/sign-in`}
                className="py-2 px-6 text-base font-medium text-black"
              >
                Sign In
              </Link>
              <Link
                to={`/sign-up`}
                className="py-2 px-6 text-base font-medium text-white bg-[#1572D3] rounded-lg"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
        {isMenuOpen && (
          <div className="absolute inset-x-0 top-0 z-50 origin-top-right transform transition lg:hidden">
            <div
              className="divide-y-2 divide-gray-50 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
              ref={dropdownRef}
            >
              <div className="px-5 pb-6 pt-5">
                <div className="flex items-center justify-between">
                  <Link onClick={() => setIsMenuOpen(!isMenuOpen)} to="/">
                    <div className=" flex items-center gap-3">
                      <Logo />

                      <h1 className=" text-base text-[#1572D3] font-semibold">
                        AutoCore
                      </h1>
                    </div>
                  </Link>

                  <div className="-mr-2">
                    <button
                      type="button"
                      onClick={toggleMenu}
                      className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                      <span className="sr-only">Close menu</span>
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <nav className="grid gap-y-4">
                    {isShopPage ? (
                      <>
                        <p className="px-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                          Categories
                        </p>
                        {mobilePartCategories.map((category) => (
                          <Link
                            key={category}
                            to={`/shop?page=1&category=${encodeURIComponent(category)}`}
                            onClick={() => setIsMenuOpen(false)}
                            className="-m-3 flex items-center rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                          >
                            <span className="ml-3 text-base font-medium text-gray-900">
                              {category}
                            </span>
                          </Link>
                        ))}
                      </>
                    ) : (
                      <>
                        {NavItems.map((item, index) => (
                          <Link
                            key={index}
                            to={item.path}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`-m-3 flex items-center rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50`}
                          >
                            <span className="ml-3 text-base font-medium text-gray-900">
                              {item.title}
                            </span>
                          </Link>
                        ))}
                        <Link
                          onClick={() => setIsMenuOpen(!isMenuOpen)}
                          to={`/?why-choose-us`}
                          className="-m-3 flex items-center rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                        >
                          <span className="ml-3 text-base font-medium text-gray-900">
                            Why choose us
                          </span>
                        </Link>
                        <Link
                          onClick={() => setIsMenuOpen(!isMenuOpen)}
                          to={`/?testimonials`}
                          className="-m-3 flex items-center rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                        >
                          <span className="ml-3 text-base font-medium text-gray-900">
                            Testimonials
                          </span>
                        </Link>
                      </>
                    )}
                  </nav>
                </div>
                <div>
                  {isAuthenticated ? (
                    <div className="mt-3">
                      <Link
                        onClick={(event) => {
                          event.preventDefault();
                          openProfileOverlay();
                        }}
                        to={"/buyer/profile"}
                        className="-m-3 flex items-center rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                      >
                        <UserRound className="h-4 w-4 text-gray-700" />
                        <span className="ml-3 text-base font-medium text-gray-900">
                          Profile
                        </span>
                      </Link>
                      <Link
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        to={"/buyer/watch-list"}
                        className="-m-3 flex items-center rounded-md px-3 py-3 text-sm font-semibold hover:bg-gray-50"
                      >
                        <Clock3 className="h-4 w-4 text-gray-700" />
                        <span className="ml-3 text-base font-medium text-gray-900">
                          Activity
                        </span>
                      </Link>
                      <Link
                        onClick={() => {
                          handleLogout();
                        }}
                        to={``}
                        className="-m-3 flex items-center rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                      >
                        <span className="ml-3 text-base font-medium text-red-300">
                          Logout
                        </span>
                      </Link>
                    </div>
                  ) : (
                    <div className=" space-x-4 mt-5 ml-3">
                      <Link
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        to={`/sign-in`}
                        className="py-2 px-6 text-base font-medium text-white bg-[#1572D3] rounded-lg"
                      >
                        Sign In
                      </Link>
                      <Link
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        to={`/sign-up`}
                        className="py-2 px-6 text-base font-medium text-white bg-[#1572D3] rounded-lg"
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {isAuthenticated && avatarOpen && (
        <div className="fixed inset-0 z-[160]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            onClick={closeProfileOverlay}
            aria-label="Close profile overlay"
          />
          <aside className="commerce-drawer absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1572D3]">
                  Account
                </p>
                <h2 className="text-xl font-bold text-slate-950">My Profile</h2>
              </div>
              <button
                type="button"
                onClick={closeProfileOverlay}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close profile"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-lg bg-[#F7FBFF] p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={profileImage}
                      alt={profileForm.name || "Profile"}
                      className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-sm"
                    />
                    <label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-[#1572D3] text-white shadow-sm">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-slate-950">
                      {user?.name || user?.user_name || "AutoCore customer"}
                    </p>
                    <p className="truncate text-sm text-slate-500">{user?.email}</p>
                    <span className="mt-2 inline-flex rounded-full bg-[#E8F1FB] px-2.5 py-1 text-xs font-bold text-[#1572D3]">
                      Customer account
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-[#1572D3]" />
                  <h3 className="font-bold text-slate-950">Profile details</h3>
                </div>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-400">
                      Full name
                    </span>
                    <input
                      value={profileForm.name}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-400">
                      Phone
                    </span>
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <input
                        value={profileForm.phone}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                        placeholder="Add phone number"
                        className="w-full text-sm outline-none"
                      />
                    </div>
                  </label>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{user?.email}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Email change will be added with verification in production.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1572D3] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {profileSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-[#1572D3]" />
                  <h3 className="font-bold text-slate-950">Change password</h3>
                </div>
                <div className="space-y-3">
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        currentPassword: event.target.value,
                      }))
                    }
                    placeholder="Current password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                  />
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        newPassword: event.target.value,
                      }))
                    }
                    placeholder="New password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                  />
                  <button
                    type="button"
                    onClick={handlePasswordSave}
                    disabled={passwordSaving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <LockKeyhole className="h-4 w-4" />
                    {passwordSaving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Navbar;
