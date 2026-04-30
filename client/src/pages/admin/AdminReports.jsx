import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  PackageCheck,
  Percent,
  TrendingUp,
} from "lucide-react";
import { getAdminAnalytics } from "../../services/commerceService";
import { notifyError } from "../../utils/Toast";

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const formatPercent = (value) => `${Math.round(Number(value || 0))}%`;

const downloadCsv = (filename, rows) => {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const AdminReports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");

  useEffect(() => {
    document.title = "AutoCore Admin Reports";
    getAdminAnalytics()
      .then(setAnalytics)
      .catch(() => notifyError("Could not load reports."))
      .finally(() => setLoading(false));
  }, []);

  const report = useMemo(() => {
    const summary = analytics?.summary || {};
    const total = Number(summary.totalOrders || 0);
    const paid = Number(summary.paidOrders || 0);
    const delivered = Number(summary.delivered || 0);
    const pending = Number(summary.pendingDispatch || 0);
    const shipped = Number(summary.shipped || 0);

    return {
      averageOrderValue: paid ? Number(summary.revenue || 0) / paid : 0,
      deliveredRatio: total ? (delivered / total) * 100 : 0,
      pendingRatio: total ? (pending / total) * 100 : 0,
      shippedRatio: total ? (shipped / total) * 100 : 0,
    };
  }, [analytics]);

  const maxOrders = useMemo(
    () =>
      Math.max(
        1,
        ...(analytics?.revenueByDay || [])
          .slice(range === "today" ? -1 : 0)
          .map((item) => item.orders || 0)
      ),
    [analytics, range]
  );

  const trendRows = useMemo(
    () => (analytics?.revenueByDay || []).slice(range === "today" ? -1 : 0),
    [analytics, range]
  );

  const exportReport = () => {
    downloadCsv("autocore-report.csv", [
      ["Metric", "Value"],
      ["Average Order Value", report.averageOrderValue],
      ["Delivered Ratio", formatPercent(report.deliveredRatio)],
      ["Pending Ratio", formatPercent(report.pendingRatio)],
      ["Shipped Ratio", formatPercent(report.shippedRatio)],
      [],
      ["Product", "Quantity Sold", "Revenue", "SKU"],
      ...(analytics?.topProducts || []).map((item) => [
        item.name,
        item.quantity,
        item.revenue,
        item.sku,
      ]),
    ]);
  };

  if (loading) {
    return (
      <div className="space-y-5 py-4">
        <div className="grid gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg bg-white shadow-sm">
              <div className="m-5 h-5 rounded bg-slate-100" />
              <div className="mx-5 h-8 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-white shadow-sm" />
      </div>
    );
  }

  return (
    <section className="py-4">
      <div className="mb-5 flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Report controls</p>
          <p className="text-xs text-slate-500">
            Use these for demo filtering and quick export.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-[#1572D3]"
          >
            <option value="7d">Last 7 days</option>
            <option value="today">Today</option>
          </select>
          <button
            type="button"
            onClick={exportReport}
            className="rounded-lg bg-[#1572D3] px-4 py-2 text-sm font-semibold text-white"
          >
            Export Report
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {[
          {
            label: "Average Order Value",
            value: formatCurrency(report.averageOrderValue),
            icon: TrendingUp,
          },
          {
            label: "Delivered Ratio",
            value: formatPercent(report.deliveredRatio),
            icon: PackageCheck,
          },
          {
            label: "Pending Ratio",
            value: formatPercent(report.pendingRatio),
            icon: Percent,
          },
          {
            label: "Shipped Ratio",
            value: formatPercent(report.shippedRatio),
            icon: Activity,
          },
        ].map((item) => (
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
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#E8F1FB] text-[#1572D3]">
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#2B3674]">Order volume</h3>
              <p className="text-sm text-slate-500">Daily order count, last 7 days</p>
            </div>
            <BarChart3 className="h-5 w-5 text-[#1572D3]" />
          </div>
          <div className="flex h-72 items-end gap-3 border-b border-slate-100 pt-10">
            {trendRows.map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-52 w-full items-end rounded-lg bg-slate-50 px-2">
                  <div
                    className="w-full rounded-t-lg bg-[#1572D3]"
                    style={{
                      height: `${Math.max(8, (Number(item.orders || 0) / maxOrders) * 100)}%`,
                    }}
                    title={`${item.orders} orders`}
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
          <h3 className="text-lg font-bold text-[#2B3674]">Fulfillment health</h3>
          <div className="mt-5 space-y-4">
            {[
              ["Delivered", report.deliveredRatio, "bg-green-500"],
              ["Shipped", report.shippedRatio, "bg-[#1572D3]"],
              ["Pending dispatch", report.pendingRatio, "bg-amber-500"],
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{label}</span>
                  <span className="font-bold text-slate-950">{formatPercent(value)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${Math.min(100, Number(value || 0))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-[#2B3674]">Product performance</h3>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
          <table className="min-w-[780px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Quantity Sold</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">SKU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(analytics?.topProducts || []).map((item) => (
                <tr key={item.productId || item.sku}>
                  <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3 font-bold text-[#1572D3]">
                    {formatCurrency(item.revenue)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.sku}</td>
                </tr>
              ))}
              {!analytics?.topProducts?.length && (
                <tr>
                  <td colSpan="4" className="px-4 py-10 text-center text-slate-500">
                    Product performance appears after paid orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default AdminReports;
