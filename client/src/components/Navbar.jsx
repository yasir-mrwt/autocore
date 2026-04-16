import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { NavItems } from "../../constants";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "/assets/image/Avatar.png";
import { CarTaxiFront, LogOut } from "lucide-react";
import { asyncLogOut } from "../store/actions/appActions";
import { Tooltip } from "@mui/material";
import { notifyError, notifySuccess } from "../utils/Toast";
import { Menu, X } from "lucide-react";

// import { useSelector } from "react-redux";
// import DarkMode from "/assets/icon/Inactive_darkmode.svg";
// import Avatar from "/assets/image/Avatar.png";
// import { Heart } from "lucide-react";

const Navbar = () => {
  const navRef = useRef(null);
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  const [avatarOpen, setAvatarOpen] = useState(false);

  const { isAuthenticated } = useSelector((state) => state.app);

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const dropdownRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
        if (event.target.id == "avatar") {
          console.log("avatar");
          return;
        } else setAvatarOpen(false);
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
        className={`container 2xl:relative ${isAuthenticated ? "py-5" : "py-5 md:py-10"
          } flex items-center justify-between px-3 dark:bg-gray-500`}
      // className="container 2xl:relative  py-5 flex items-center justify-between px-3 dark:bg-gray-500"
      >
        <Link to="/">
          <div className=" flex items-center gap-3">
            <Logo />

            <h1 className=" text-base text-[#1572D3] font-semibold">
              AutoCore
            </h1>
          </div>
        </Link>
        <div className="hidden lg:block">
          <ul className="inline-flex space-x-8">
            {NavItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={`${item.path == "/cars" ? "/cars?page=1" : item.path}`}
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
        <div className="hidden lg:block">
          {isAuthenticated ? (
            <div className="flex gap-6 bg-white px-5 py-2 rounded-full items-center relative shadow-lg">
              <Tooltip title={"WatchList"} arrow>
                <CarTaxiFront
                  onClick={() => {
                    navigate("/buyer/watch-list");
                  }}
                  size={26}
                  className="text-gray-500 hover:text-red-700 cursor-pointer transition-all"
                />
              </Tooltip>
              <Link
                onClick={() => {
                  setAvatarOpen(!avatarOpen);
                }}
              >
                <img
                  id="avatar"
                  src={Avatar}
                  alt="Avatar"
                  className=" object-cover"
                />
                {avatarOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-[105%] flex flex-col text-gray-600 rounded-lg gap-1 text-center right-0 bg-white   p-1 shadow-2xl"
                  >
                    <Link
                      to={"/buyer/my-cars"}
                      className="transition-all rounded-lg py-3 px-4 hover:bg-gray-100"
                    >
                      {" "}
                      My Parts
                    </Link>
                    <hr />
                    <button
                      onClick={() => {
                        const res = dispatch(asyncLogOut());
                        console.log(res);
                        if (res == 200)
                          notifySuccess("Logged out successfully!");
                        else notifyError("Error logging out!");
                      }}
                      className="flex px-4 py-3 gap-3 pt-3   items-center text-red-500 hover:bg-red-100  transition-all rounded-lg"
                    >
                      <LogOut size={20} /> Logout
                    </button>
                  </div>
                )}
              </Link>
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
        <div className="lg:hidden">
          <Menu onClick={toggleMenu} className="h-6 w-6 cursor-pointer" />
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
                    {NavItems.map((item, index) => (
                      <Link
                        key={index}
                        to={`${item.path == "/cars" ? "/cars?page=1" : item.path
                          }`}
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
                  </nav>
                </div>
                <div>
                  {isAuthenticated ? (
                    <div className="mt-3">
                      <Link
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        to={"/buyer/watch-list"}
                        className="-m-3 flex items-center rounded-md px-3 py-3 text-sm font-semibold hover:bg-gray-50"
                      >
                        <span className="ml-3 text-base font-medium text-gray-900">
                          WatchList
                        </span>
                      </Link>
                      <Link
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        to={"/buyer/my-cars"}
                        className="-m-3 flex items-center rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                      >
                        <span className="ml-3 text-base font-medium text-gray-900">
                          My Parts
                        </span>
                      </Link>
                      <Link
                        onClick={() => {
                          const res = dispatch(asyncLogOut());
                          console.log(res);
                          if (res == 200)
                            notifySuccess("Logged out successfully!");
                          else notifyError("Error logging out!");
                          setIsMenuOpen(!isMenuOpen);
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
    </div>
  );
};

export default Navbar;
