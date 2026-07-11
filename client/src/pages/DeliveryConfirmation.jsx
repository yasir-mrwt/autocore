import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { confirmDeliveryFromEmail } from "../services/commerceService";

const DeliveryConfirmation = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Confirming delivery...");
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Delivery confirmation link is missing.");
      return;
    }

    let active = true;
    confirmDeliveryFromEmail(token)
      .then((data) => {
        if (!active) return;
        setStatus("success");
        setMessage(data.message || "Delivery confirmed. Thank you.");
        setOrderNumber(data.order?.orderNumber || "");
      })
      .catch((error) => {
        if (!active) return;
        setStatus("error");
        setMessage(
          error?.response?.data?.message ||
            "Delivery confirmation link is invalid or expired."
        );
      });

    return () => {
      active = false;
    };
  }, [params]);

  const Icon =
    status === "loading" ? LoaderCircle : status === "success" ? CheckCircle2 : XCircle;

  return (
    <main className="grid min-h-[70vh] place-items-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div
          className={`mx-auto grid h-14 w-14 place-items-center rounded-lg ${
            status === "success"
              ? "bg-green-50 text-green-600"
              : status === "error"
                ? "bg-red-50 text-red-600"
                : "bg-[#E8F1FB] text-[#1572D3]"
          }`}
        >
          <Icon className={`h-7 w-7 ${status === "loading" ? "animate-spin" : ""}`} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          {status === "success"
            ? "Delivery Confirmed"
            : status === "error"
              ? "Could Not Confirm"
              : "Confirming Delivery"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        {orderNumber && (
          <p className="mt-3 rounded-lg bg-[#F7FBFF] px-3 py-2 text-sm font-semibold text-[#1572D3]">
            {orderNumber}
          </p>
        )}
        <Link
          to="/buyer/watch-list"
          className="mt-6 inline-flex rounded-lg bg-[#1572D3] px-5 py-3 text-sm font-semibold text-white"
        >
          View recent orders
        </Link>
      </section>
    </main>
  );
};

export default DeliveryConfirmation;
