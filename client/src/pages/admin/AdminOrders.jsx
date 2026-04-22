import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  CreditCard,
  Eye,
  Mail,
  PackageCheck,
  PackagePlus,
  Search,
  Truck,
  X,
} from "lucide-react";
import {
  adminMarkOrderDelivered,
  getAdminOrders,
  prepareAdminOrderDispatch,
  sendAdminDeliveryConfirmation,
  shipAdminOrder,
} from "../../services/commerceService";
import { notifyError, notifySuccess } from "../../utils/Toast";

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "Not set";

const formatStatus = (value) => String(value || "").replaceAll("_", " ");

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

const getStatusClass = (status) => {
  if (["PAID", "PROCESSING", "READY_TO_DISPATCH", "SHIPPED"].includes(status)) {
    return "bg-[#E8F1FB] text-[#1572D3]";
  }
  if (status === "DELIVERED") return "bg-green-100 text-green-700";
  if (["CANCELLED", "REFUNDED"].includes(status)) return "bg-red-100 text-red-600";
  return "bg-amber-100 text-amber-700";
};

const getNextActionText = (order) => {
  if (order.paymentStatus !== "SUCCEEDED") return "Waiting for payment";
  if (["PAID", "PROCESSING"].includes(order.status)) return "Prepare dispatch";
  if (order.status === "READY_TO_DISPATCH") return "Ship now";
  if (order.status === "SHIPPED" && !order.deliveryConfirmationSentAt) {
    return "Send confirmation";
  }
  if (order.status === "SHIPPED") return "Await customer confirmation";
  if (order.status === "DELIVERED") return "Completed";
  return formatStatus(order.status);
};

const AdminOrders = ({
  title = "Orders",
  statusFilter = null,
  mode = "all",
}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [drafts, setDrafts] = useState({});
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const stats = useMemo(
    () => ({
      total: orders.length,
      paid: orders.filter((order) => order.paymentStatus === "SUCCEEDED").length,
      ready: orders.filter((order) => order.status === "READY_TO_DISPATCH").length,
      shipped: orders.filter((order) => order.status === "SHIPPED").length,
      delivered: orders.filter((order) => order.status === "DELIVERED").length,
    }),
    [orders]
  );

  const visibleOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      if (statusFilter?.length && !statusFilter.includes(order.status)) return false;
      if (!term) return true;
      return [
        order.orderNumber,
        order.customer?.name,
        order.customer?.email,
        order.courierName,
        order.trackingNumber,
        ...(order.items || []).map((item) => item.productName),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });

    return [...filtered].sort((a, b) => {
      if (sort === "value") return Number(b.total || 0) - Number(a.total || 0);
      if (sort === "eta") {
        return (
          new Date(a.estimatedDeliveryAt || "2999-01-01").getTime() -
          new Date(b.estimatedDeliveryAt || "2999-01-01").getTime()
        );
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders, query, sort, statusFilter]);

  const loadOrders = () => {
    setLoading(true);
    const params = statusFilter?.length ? { status: statusFilter.join(",") } : {};
    getAdminOrders(params)
      .then(setOrders)
      .catch(() => notifyError("Could not load orders."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = `AutoCore Admin ${title}`;
    loadOrders();
  }, [title]);

  const updateDraft = (orderNumber, field, value) => {
    setDrafts((current) => ({
      ...current,
      [orderNumber]: {
        ...current[orderNumber],
        [field]: value,
      },
    }));
  };

  const mergeOrder = (updatedOrder) => {
    setOrders((current) =>
      current.map((item) => (item.id === updatedOrder.id ? updatedOrder : item))
    );
    setSelectedOrder((current) =>
      current?.id === updatedOrder.id ? updatedOrder : current
    );
  };

  const runAction = async (order, action, label, request) => {
    setSavingId(`${order.orderNumber}-${action}`);
    try {
      const updatedOrder = await request();
      mergeOrder(updatedOrder);
      notifySuccess(label);
    } catch (error) {
      notifyError(error?.response?.data?.message || "Could not update order.");
    } finally {
      setSavingId("");
    }
  };

  const prepareDispatch = (order) => {
    const draft = drafts[order.orderNumber] || {};
    runAction(order, "prepare", "Order is ready for dispatch.", () =>
      prepareAdminOrderDispatch(order.orderNumber, {
        deliveryDays: draft.deliveryDays ? Number(draft.deliveryDays) : undefined,
        note: draft.note,
      })
    );
  };

  const shipOrder = (order) => {
    const draft = drafts[order.orderNumber] || {};
    runAction(order, "ship", "Order shipped. Confirmation reminder scheduled.", () =>
      shipAdminOrder(order.orderNumber, {
        deliveryDays: draft.deliveryDays ? Number(draft.deliveryDays) : undefined,
        courierName: draft.courierName,
        trackingNumber: draft.trackingNumber,
        trackingUrl: draft.trackingUrl,
        shipmentNotes: draft.note,
      })
    );
  };

  const sendConfirmation = (order) => {
    runAction(order, "confirm-email", "Delivery confirmation email recorded.", () =>
      sendAdminDeliveryConfirmation(order.orderNumber)
    );
  };

  const markDelivered = (order) => {
    const draft = drafts[order.orderNumber] || {};
    runAction(order, "delivered", "Order marked delivered.", () =>
      adminMarkOrderDelivered(order.orderNumber, { note: draft.note })
    );
  };

  const exportOrders = () => {
    downloadCsv("autocore-orders.csv", [
      [
        "Order Number",
        "Customer",
        "Email",
        "Status",
        "Payment Status",
        "Total",
        "Courier",
        "Tracking",
        "Created At",
      ],
      ...visibleOrders.map((order) => [
        order.orderNumber,
        order.customer?.name,
        order.customer?.email,
        order.status,
        order.paymentStatus,
        order.total,
        order.courierName,
        order.trackingNumber,
        order.createdAt,
      ]),
    ]);
  };

  const renderActions = (order) => {
    const canPrepare =
      order.paymentStatus === "SUCCEEDED" && ["PAID", "PROCESSING"].includes(order.status);
    const canShip =
      order.paymentStatus === "SUCCEEDED" &&
      ["READY_TO_DISPATCH", "PAID", "PROCESSING"].includes(order.status);
    const canSendConfirmation = order.status === "SHIPPED";
    const canMarkDelivered = ["SHIPPED", "DELIVERED"].includes(order.status);

    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {canPrepare && (
          <button
            type="button"
            onClick={() => prepareDispatch(order)}
            disabled={savingId === `${order.orderNumber}-prepare`}
            className="rounded-lg border border-[#1572D3] px-4 py-2 text-sm font-semibold text-[#1572D3] transition-colors hover:bg-[#E8F1FB] disabled:opacity-60"
          >
            {savingId === `${order.orderNumber}-prepare` ? "Preparing..." : "Prepare Dispatch"}
          </button>
        )}
        {canShip && (
          <button
            type="button"
            onClick={() => shipOrder(order)}
            disabled={savingId === `${order.orderNumber}-ship`}
            className="rounded-lg bg-[#1572D3] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0d5bb5] disabled:opacity-60"
          >
            {savingId === `${order.orderNumber}-ship` ? "Shipping..." : "Ship Now"}
          </button>
        )}
        {canSendConfirmation && (
          <button
            type="button"
            onClick={() => sendConfirmation(order)}
            disabled={savingId === `${order.orderNumber}-confirm-email`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Send Confirmation
            </span>
          </button>
        )}
        {canMarkDelivered && (
          <button
            type="button"
            onClick={() => markDelivered(order)}
            disabled={savingId === `${order.orderNumber}-delivered`}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
          >
            Mark Delivered
          </button>
        )}
      </div>
    );
  };

  return (
    <section className="w-full py-4">
      <div className="mb-6 grid gap-4 xl:grid-cols-5">
        {[
          { label: "Total Orders", value: stats.total, icon: PackageCheck },
          { label: "Paid Orders", value: stats.paid, icon: CreditCard },
          { label: "Ready", value: stats.ready, icon: PackagePlus },
          { label: "Shipped", value: stats.shipped, icon: Truck },
          { label: "Delivered", value: stats.delivered, icon: Clock3 },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-[#2B3674]">
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

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            {visibleOrders.length} result{visibleOrders.length === 1 ? "" : "s"}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportOrders}
              className="w-fit rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={loadOrders}
              className="w-fit rounded-lg border border-[#1572D3]/20 px-4 py-2 text-sm font-semibold text-[#1572D3]"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px]">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, customer, item, courier, tracking..."
              className="w-full text-sm outline-none"
            />
          </label>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
          >
            <option value="newest">Newest first</option>
            <option value="value">Highest value</option>
            <option value="eta">ETA soonest</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3 rounded-lg border border-slate-100 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="grid animate-pulse gap-4 md:grid-cols-[1fr_1fr_1fr_120px]">
                <div className="h-11 rounded-lg bg-slate-100" />
                <div className="h-11 rounded-lg bg-slate-100" />
                <div className="h-11 rounded-lg bg-slate-100" />
                <div className="h-11 rounded-lg bg-slate-100" />
              </div>
            ))}
          </div>
        ) : visibleOrders.length ? (
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Next</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-950">{order.orderNumber}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">
                        {order.customer?.name || "Customer"}
                      </p>
                      <p className="text-xs text-slate-500">{order.customer?.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">
                        {(order.items || []).length} item(s)
                      </p>
                      <p className="line-clamp-1 text-xs text-slate-500">
                        {(order.items || []).map((item) => item.productName).join(", ")}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-950">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClass(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-[#1572D3]">
                      {getNextActionText(order)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-slate-200 text-center">
            <div>
              <PackageCheck className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-xl font-bold text-slate-950">
                No matching orders
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Orders will appear here as customers complete checkout.
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[140]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            onClick={() => setSelectedOrder(null)}
            aria-label="Close order details"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1572D3]">
                  Order Detail
                </p>
                <h3 className="text-xl font-bold text-slate-950">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClass(selectedOrder.status)}`}>
                    {formatStatus(selectedOrder.status)}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClass(selectedOrder.paymentStatus === "SUCCEEDED" ? "PAID" : "PENDING_PAYMENT")}`}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Customer</p>
                    <p className="mt-1 font-bold text-slate-950">
                      {selectedOrder.customer?.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedOrder.customer?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Total</p>
                    <p className="mt-1 text-xl font-bold text-[#1572D3]">
                      {formatCurrency(selectedOrder.total)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={drafts[selectedOrder.orderNumber]?.deliveryDays || ""}
                  onChange={(event) =>
                    updateDraft(selectedOrder.orderNumber, "deliveryDays", event.target.value)
                  }
                  placeholder="Delivery days"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                />
                <input
                  value={drafts[selectedOrder.orderNumber]?.courierName || ""}
                  onChange={(event) =>
                    updateDraft(selectedOrder.orderNumber, "courierName", event.target.value)
                  }
                  placeholder="Courier name"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                />
                <input
                  value={drafts[selectedOrder.orderNumber]?.trackingNumber || ""}
                  onChange={(event) =>
                    updateDraft(selectedOrder.orderNumber, "trackingNumber", event.target.value)
                  }
                  placeholder="Tracking number"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                />
                <input
                  value={drafts[selectedOrder.orderNumber]?.trackingUrl || ""}
                  onChange={(event) =>
                    updateDraft(selectedOrder.orderNumber, "trackingUrl", event.target.value)
                  }
                  placeholder="Tracking URL"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                />
              </div>
              <textarea
                value={drafts[selectedOrder.orderNumber]?.note || ""}
                onChange={(event) =>
                  updateDraft(selectedOrder.orderNumber, "note", event.target.value)
                }
                placeholder="Dispatch notes"
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
              />
              {renderActions(selectedOrder)}

              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                  Items
                </h4>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                      <img
                        src={item.product?.image}
                        alt={item.productName}
                        className="h-14 w-14 rounded-lg bg-white object-contain p-2"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-bold text-slate-900">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          Qty {item.quantity} - {formatCurrency(item.lineTotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                  Fulfillment
                </h4>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Courier</p>
                    <p className="font-bold text-slate-900">
                      {selectedOrder.courierName || "Not set"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Tracking</p>
                    <p className="font-bold text-slate-900">
                      {selectedOrder.trackingNumber || "Not set"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Shipped</p>
                    <p className="font-bold text-slate-900">
                      {formatDate(selectedOrder.shippedAt)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Confirmation email</p>
                    <p className="font-bold text-slate-900">
                      {formatDate(selectedOrder.deliveryConfirmationSentAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                  Timeline
                </h4>
                <div className="space-y-3">
                  {(selectedOrder.timeline || []).map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#1572D3]" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{event.label}</p>
                        {event.message && (
                          <p className="text-xs leading-5 text-slate-500">
                            {event.message}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400">
                          {formatDate(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

export default AdminOrders;
