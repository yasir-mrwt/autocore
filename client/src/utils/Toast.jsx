import { LoaderCircle } from "lucide-react";
import { toast } from "react-toastify";

export const notifyPendingPromise = (msg) => {
  const pending = (
    <div className="flex gap-[1vmax] items-center">
      <LoaderCircle className="rotate" />
      <span>{msg}</span>
    </div>
  );
  return toast(pending, {
    autoClose: false,
    type: "pending",
    position: "top-right",
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
  });
};

export const notifySuccessPromise = (toastId, msg) => {
  return toast.update(toastId, {
    autoClose: 2000,
    render: msg,
    type: "success",
    hideProgressBar: false,
  });
};

export const notifyErrorPromise = (toastId, msg) => {
  return toast.update(toastId, {
    autoClose: 2000,
    render: msg,
    type: "error",
    hideProgressBar: false,
  });
};

export const notifyError = (msg) => {
  return toast.error(msg, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
  });
};

export const notifySuccess = (msg) => {
  return toast.success(msg, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
  });
};

export const notifyInfo = (msg) => {
  return toast.info(msg, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
  });
};
