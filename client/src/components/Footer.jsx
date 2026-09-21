import { Link } from "react-router-dom";
import Logo from "./Logo";

const linkClass =
  "text-sm font-medium text-[#D6D6D6] transition-colors hover:text-white md:text-base";

const Footer = () => {
  return (
    <section className="relative overflow-hidden bg-[#051C34] py-10 text-white">
      <div className="relative z-10 container px-4">
        <div className="-m-6 flex flex-wrap">
          <div className="w-full p-6 md:w-1/2 lg:w-5/12">
            <div className="flex h-full flex-col justify-between gap-10">
              <Link to="/" className="flex items-center gap-3">
                <Logo color="white" />
                <h1 className="text-sm font-semibold text-white md:text-base">
                  AutoCore
                </h1>
              </Link>
              <div>
                <p className="mb-4 text-sm font-medium text-slate-200 md:text-base">
                  Verified spare parts, simple checkout, and clear order tracking.
                </p>
                <p className="text-xs text-slate-400 md:text-sm">
                  &copy; Copyright 2026. All Rights Reserved by AutoCore. Built by{" "}
                  <a
                    className="font-medium text-slate-200 transition-colors hover:text-white"
                    href="https://yasirmarwat.site"
                    target="_blank"
                    rel="noopener"
                  >
                    Yasir Marwat
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          <div className="w-full p-6 md:w-1/2 lg:w-2/12">
            <h3 className="mb-5 text-lg font-semibold uppercase tracking-wide text-white">
              Storefront
            </h3>
            <ul className="space-y-4">
              <li>
                <Link className={linkClass} to="/shop">
                  Shop Parts
                </Link>
              </li>
              <li>
                <Link className={linkClass} to="/?why-choose-us">
                  Why Choose Us
                </Link>
              </li>
              <li>
                <Link className={linkClass} to="/?testimonials">
                  Reviews
                </Link>
              </li>
              <li>
                <Link className={linkClass} to="/buyer/watch-list">
                  Activity
                </Link>
              </li>
            </ul>
          </div>

          <div className="w-full p-6 md:w-1/2 lg:w-2/12">
            <h3 className="mb-5 text-lg font-semibold uppercase tracking-wide text-white">
              Support
            </h3>
            <ul className="space-y-4">
              <li>
                <Link className={linkClass} to="/sign-in">
                  Sign In
                </Link>
              </li>
              <li>
                <Link className={linkClass} to="/sign-up">
                  Create Account
                </Link>
              </li>
              <li>
                <Link className={linkClass} to="/buyer/profile">
                  Profile
                </Link>
              </li>
              <li>
                <Link className={linkClass} to="/buyer/watch-list">
                  Orders
                </Link>
              </li>
            </ul>
          </div>

          <div className="w-full p-6 md:w-1/2 lg:w-3/12">
            <h3 className="mb-5 text-lg font-semibold uppercase tracking-wide text-white">
              Admin
            </h3>
            <ul className="space-y-4">
              <li>
                <Link className={linkClass} to="/admin/login">
                  Admin Login
                </Link>
              </li>
              <li>
                <Link className={linkClass} to="/admin/overview">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link className={linkClass} to="/admin/orders">
                  Orders
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Footer;
