import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  PackageCheck,
  PackagePlus,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getAdminAnalytics } from "../../services/commerceService";
import { notifyError } from "../../utils/Toast";

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const formatStatus = (value) => String(value || "").replaceAll("_", " ");

const AdminOverview = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "AutoCore Admin Dashboard";
    getAdminAnalytics()
      .then(setAnalytics)
      .catch(() => notifyError("Could not load admin analytics."))
      .finally(() => setLoading(false));
  }, []);

  const maxRevenue = useMemo(
    () =>
      Math.max(
        1,
        ...(analytics?.revenueByDay || []).map((item) => Number(item.revenue || 0))
      ),
    [analytics]
  );

  if (loading) {
    return (
      <div className="space-y-6 py-4">
        <div className="grid gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg bg-white shadow-sm">
              <div className="m-5 h-5 rounded bg-slate-100" />
              <div className="mx-5 h-8 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="h-80 animate-pulse rounded-lg bg-white shadow-sm" />
          <div className="h-80 animate-pulse rounded-lg bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const cards = [
    {
      label: "Revenue",
      value: formatCurrency(summary.revenue),
      icon: BarChart3,
      tone: "bg-[#E8F1FB] text-[#1572D3]",
    },
    {
      label: "Paid Orders",
      value: summary.paidOrders || 0,
      icon: CreditCard,
      tone: "bg-green-100 text-green-700",
    },
    {
      label: "Pending Dispatch",
      value: summary.pendingDispatch || 0,
      icon: PackagePlus,
      tone: "bg-amber-100 text-amber-700",
    },
    {
      label: "Shipped",
      value: summary.shipped || 0,
      icon: Truck,
      tone: "bg-[#E8F1FB] text-[#1572D3]",
    },
  ];

  return (
    <section className="py-4">
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {[
          ["Prepare dispatch", "/admin/pending", "Move paid orders into fulfillment."],
          ["Ship orders", "/admin/ready", "Add courier details and send packages."],
          ["Confirm delivery", "/admin/confirmations", "Close the delivery loop."],
        ].map(([label, path, copy]) => (
          <Link
            key={label}
            to={path}
            className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm transition-colors hover:bg-[#F7FBFF]"
          >
            <div>
              <p className="font-bold text-slate-950">{label}</p>
              <p className="mt-1 text-sm text-slate-500">{copy}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-[#1572D3]" />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {cards.map((item) => (
          <div key={item.label} className="rounded-lg bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-[#2B3674]">
                  {item.value}
                </p>
              </div>
              <div className={`grid h-11 w-11 place-items-center rounded-lg ${item.tone}`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#2B3674]">
                Revenue trend
              </h3>
              <p className="text-sm text-slate-500">Last 7 days</p>
            </div>
            <span className="rounded-full bg-[#E8F1FB] px-3 py-1 text-xs font-bold text-[#1572D3]">
              Live from orders
            </span>
          </div>
          <div className="flex h-64 items-end gap-3 border-b border-slate-100 pt-8">
            {(analytics?.revenueByDay || []).map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-48 w-full items-end rounded-lg bg-slate-50 px-2">
                  <div
                    className="w-full rounded-t-lg bg-[#1572D3]"
                    style={{
                      height: `${Math.max(8, (Number(item.revenue || 0) / maxRevenue) * 100)}%`,
                    }}
                    title={formatCurrency(item.revenue)}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-[#2B3674]">Status summary</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(analytics?.statusCounts || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-700">
                  {formatStatus(status)}
                </span>
                <span className="text-sm font-bold text-[#1572D3]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-[#2B3674]">Top products</h3>
          <div className="mt-4 space-y-3">
            {(analytics?.topProducts || []).map((item) => (
              <div key={item.productId || item.sku} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-[#1572D3]">
                  {formatCurrency(item.revenue)}
                </p>
              </div>
            ))}
            {!analytics?.topProducts?.length && (
              <p className="py-8 text-center text-sm text-slate-500">
                Paid order products will appear here.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-[#2B3674]">Recent orders</h3>
          <div className="mt-4 space-y-3">
            {(analytics?.recentOrders || []).map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">
                    {order.customer?.name || "Customer"} - {formatStatus(order.status)}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#1572D3]">
                  {formatCurrency(order.total)}
                </p>
              </div>
            ))}
            {!analytics?.recentOrders?.length && (
              <div className="grid min-h-40 place-items-center text-center">
                <div>
                  <PackageCheck className="mx-auto h-9 w-9 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No orders yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminOverview;
