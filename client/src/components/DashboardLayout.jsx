import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LogOut,
  Menu,
  PackageCheck,
  PackagePlus,
  Settings,
  Truck,
  UsersRound,
  X,
} from "lucide-react";
import { menuItems } from "../../constants";
import Logo from "../components/Logo";
import { Link, useLocation } from "react-router-dom";
import { asyncLogOut } from "../store/actions/appActions";
import { useDispatch } from "react-redux";
import { getAdminAnalytics } from "../services/commerceService";
import {
  notifyErrorPromise,
  notifyPendingPromise,
  notifySuccessPromise,
} from "../utils/Toast";

const iconMap = {
  overview: BarChart3,
  orders: ClipboardList,
  pending: Clock3,
  ready: PackagePlus,
  shipped: Truck,
  confirmations: CheckCircle2,
  products: Boxes,
  customers: UsersRound,
  analytics: PackageCheck,
  settings: Settings,
};

const pageDetails = {
  overview: {
    eyebrow: "Overview",
    title: "AutoCore operations",
    description: "Revenue, fulfillment health, recent orders, and product movement.",
  },
  orders: {
    eyebrow: "Fulfillment",
    title: "Orders",
    description: "Search, inspect, and move orders through the delivery lifecycle.",
  },
  pending: {
    eyebrow: "New work",
    title: "Pending / New Orders",
    description: "Paid orders waiting for dispatch preparation.",
  },
  ready: {
    eyebrow: "Dispatch queue",
    title: "Ready for Dispatch",
    description: "Packed orders ready for courier and shipment details.",
  },
  shipped: {
    eyebrow: "In transit",
    title: "Shipped Orders",
    description: "Track courier, ETA, and delivery progress.",
  },
  confirmations: {
    eyebrow: "Delivery checks",
    title: "Delivery Confirmation",
    description: "Send confirmation requests and close delivered orders.",
  },
  products: {
    eyebrow: "Catalog",
    title: "Products",
    description: "Review product stock, prices, categories, and catalog health.",
  },
  customers: {
    eyebrow: "Customers",
    title: "Customers",
    description: "View customer spend, order count, and recent activity.",
  },
  analytics: {
    eyebrow: "Reports",
    title: "Analytics / Reports",
    description: "Deeper operational ratios, revenue trends, and product performance.",
  },
  settings: {
    eyebrow: "Configuration",
    title: "Settings",
    description: "Brand, notification, and fulfillment settings for future control.",
  },
};

const getActivePath = (pathname) => {
  const path = pathname.split("/").filter(Boolean)[1] || "overview";
  return pageDetails[path] ? path : "overview";
};

const formatStatus = (value) => String(value || "").replaceAll("_", " ");

const DashboardLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const activePath = getActivePath(pathname);
  const activeDetails = pageDetails[activePath];

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;

    getAdminAnalytics()
      .then((analytics) => {
        if (!active) return;

        const summary = analytics?.summary || {};
        const recentOrders = analytics?.recentOrders || [];
        const nextNotifications = [
          Number(summary.pendingDispatch || 0) > 0 && {
            id: "pending-dispatch",
            title: `${summary.pendingDispatch} order(s) need preparation`,
            copy: "Open Pending / New Orders to prepare dispatch.",
            tone: "bg-amber-100 text-amber-700",
          },
          Number(summary.shipped || 0) > 0 && {
            id: "shipped",
            title: `${summary.shipped} order(s) are in transit`,
            copy: "Check shipped orders for courier and ETA status.",
            tone: "bg-[#E8F1FB] text-[#1572D3]",
          },
          ...recentOrders.slice(0, 3).map((order) => ({
            id: order.id,
            title: order.orderNumber,
            copy: `${order.customer?.name || "Customer"} - ${formatStatus(order.status)}`,
            tone: "bg-slate-100 text-slate-600",
          })),
        ].filter(Boolean);

        setNotifications(nextNotifications);
      })
      .catch(() => {
        if (active) setNotifications([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    const id = notifyPendingPromise("Logging out...");
    const res = dispatch(asyncLogOut("Admin"));
    if (res == 200) notifySuccessPromise(id, "Logged out successfully!");
    else notifyErrorPromise(id, "Error logging out!");
  };

  const unreadCount = notifications.length;

  const Sidebar = () => (
    <aside className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <Logo />
        <div>
          <h1 className="text-base font-bold text-[#1572D3]">AutoCore</h1>
          <p className="text-xs font-semibold text-slate-400">Admin Console</p>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
          Operations
        </p>
        <div className="mt-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = iconMap[item.path] || ClipboardList;
            const active = activePath === item.path;

            return (
              <Link
                key={item.path}
                to={`/admin/${item.path}`}
                className={`flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[#E8F1FB] text-[#1572D3]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.name}
                </span>
                {active && <span className="h-2 w-2 rounded-full bg-[#1572D3]" />}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#F7FBFF] text-slate-950">
      {mobileOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close admin navigation"
          />
          <div className="relative h-full w-[290px] shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      <div className="fixed left-0 top-0 hidden h-screen w-[286px] border-r border-slate-100 shadow-sm lg:block">
        <Sidebar />
      </div>

      <header className="fixed left-0 top-0 z-[80] w-full border-b border-slate-100 bg-white/95 px-4 shadow-sm backdrop-blur lg:left-[286px] lg:w-[calc(100%-286px)] lg:px-8">
        <div className="flex min-h-[118px] flex-col justify-center gap-3 py-3 lg:min-h-[82px] lg:flex-row lg:items-center lg:justify-between lg:gap-5 lg:py-0">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <div className="flex items-center gap-3">
              <Logo />
              <div>
                <h1 className="text-sm font-bold text-[#1572D3]">AutoCore</h1>
                <p className="text-[11px] font-semibold text-slate-400">
                  Admin Console
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNotificationsOpen((current) => !current)}
                className="relative rounded-lg border border-slate-100 p-2 text-slate-500"
                aria-label="Admin notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#1572D3]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg bg-[#1572D3] p-2 text-white shadow-sm"
                aria-label="Open admin navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1572D3]">
                {activeDetails.eyebrow}
              </p>
              <h2 className="mt-1 truncate text-xl font-bold text-[#2B3674] md:text-2xl">
                {activeDetails.title}
              </h2>
              <p className="mt-1 line-clamp-1 text-xs text-slate-500 lg:hidden">
                {activeDetails.description}
              </p>
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <p className="hidden max-w-xl text-right text-sm leading-6 text-slate-500 xl:block">
                {activeDetails.description}
              </p>
              <button
                type="button"
                onClick={() => setNotificationsOpen((current) => !current)}
                className="relative rounded-lg border border-slate-100 bg-white p-2.5 text-slate-500 shadow-sm"
                aria-label="Admin notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#1572D3]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {notificationsOpen && (
        <div className="fixed right-4 top-[78px] z-[95] w-[calc(100%-2rem)] max-w-sm rounded-lg border border-slate-100 bg-white p-3 shadow-2xl lg:right-8 lg:top-[72px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <p className="text-sm font-bold text-slate-950">Admin activity</p>
              <p className="text-xs text-slate-500">Latest operational signals</p>
            </div>
            <span className="rounded-full bg-[#E8F1FB] px-2 py-1 text-xs font-bold text-[#1572D3]">
              {unreadCount}
            </span>
          </div>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {notifications.length ? (
              notifications.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.tone}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.copy}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="grid min-h-32 place-items-center text-center">
                <div>
                  <Bell className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    No urgent activity
                  </p>
                  <p className="text-xs text-slate-400">
                    New orders and dispatch alerts will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="h-screen overflow-y-auto px-4 pb-8 pt-[142px] lg:ml-[286px] lg:px-8 lg:pt-[106px]">
        <div className="mx-auto max-w-[1500px]">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
