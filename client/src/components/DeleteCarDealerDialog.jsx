import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { asyncDeleteCar } from "../store/actions/carActions";
import {
  notifyErrorPromise,
  notifyPendingPromise,
  notifySuccessPromise,
} from "../utils/Toast";

const DeleteCarDealerDialog = ({ setDeleteOpen }) => {
  const { selectedCar } = useSelector((state) => state.app);

  const dispatch = useDispatch();

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleDelete = () => {
    const id = notifyPendingPromise("Deleting car...");
    dispatch(asyncDeleteCar(selectedCar._id)).then((res) => {
      if (res == 200) {
        notifySuccessPromise(id, "Car deleted successfully!");
        setDeleteOpen(false);
      } else notifyErrorPromise(id, res.message);
    });
  };

  return (
    <div
      onClick={() => {}}
      className={`bg-white flex flex-col gap-4 rounded-xl p-[3vh] `}
    >
      <h3 className="text-lg font-semibold ">Delete Car</h3>
      <p>Do you really want to delete the car? This action cannot be undone.</p>
      <div className="flex gap-5">
        <div className="flex-1"></div>
        <button
          onClick={handleDelete}
          className="bg-red-500 hover:bg-red-400 rounded-lg flex items-center gap-1 text-white px-3 py-1"
        >
          Delete
        </button>
        <button
          onClick={() => {
            setDeleteOpen(false);
          }}
          className="bg-slate-400 hover:bg-slate-300 transition-all rounded-lg flex items-center gap-1 text-white px-3 py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DeleteCarDealerDialog;
