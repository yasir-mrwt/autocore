import { Trash, Pencil, LoaderCircle } from "lucide-react";
import Car_img from "/assets/image/car_img1.png";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { notifyError } from "../../utils/Toast";
import { asyncGetDealerCars } from "../../store/actions/carActions";
import Pagination from "../../components/Pagination";
import Ribbon from "../../components/Ribbon";
import { updateSelectedCar } from "../../store/reducers/appReducer";
import DeleteCarDealerDialog from "../../components/DeleteCarDealerDialog";

const MyCars = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("AllCars");

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [cars, setCars] = useState(false);

  const { myCars, user } = useSelector((state) => state.app);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [page, setPage] = useState(searchParams.get("page") || 1);

  useEffect(() => {
    document.title = "My-Cars";
  }, []);

  useEffect(() => {
    if (activeTab == "ActiveCars") {
      setCars(myCars?.filter((car) => !car.sold));
    } else if (activeTab == "Ongoing") {
      setCars(myCars?.filter((car) => car?.bargain));
    } else if (activeTab == "SoldCars") {
      setCars(myCars?.filter((car) => car.sold));
    } else {
      setCars(myCars);
    }
  }, [activeTab, myCars]);

  useEffect(() => {
    if (user) {
      dispatch(asyncGetDealerCars(user._id, page)).then((res) => {
        if (res == 200) console.log("successfully fetched dealer cars");
        else notifyError(res.message);
      });
    }
  }, [user]);

  useEffect(() => {
    navigate(`${location.pathname}?page=${page}`);

    if (user) {
      dispatch(asyncGetDealerCars(user._id, page)).then((res) => {
        if (res == 200) console.log("successfully fetched dealer cars");
        else notifyError(res.message);
      });
    }
  }, [page]);

  return (
    <div className=" container flex flex-col py-4 ">
      <div className="mt-7 text-xs lg:text-base w-full justify-between flex items-center gap-7">
        <div>
          <button
            onClick={() => setActiveTab("AllCars")}
            className={` ${
              activeTab == "AllCars" ? "bg-white font-semibold shadow-2xl" : ""
            } p-2 lg:p-4  rounded-t-xl transition-all`}
          >
            All Cars
          </button>
          <button
            onClick={() => setActiveTab("ActiveCars")}
            className={`${
              activeTab == "ActiveCars"
                ? "bg-white font-semibold shadow-lg"
                : ""
            } p-2 lg:p-4  rounded-t-xl transition-all`}
          >
            Active Cars
          </button>
          <button
            onClick={() => setActiveTab("Ongoing")}
            className={` ${
              activeTab == "Ongoing" ? "bg-white font-semibold shadow-2xl" : ""
            } p-2 lg:p-4  rounded-t-xl transition-all`}
          >
            Ongoing Deals
          </button>
          <button
            onClick={() => setActiveTab("SoldCars")}
            className={` ${
              activeTab == "SoldCars" ? "bg-white font-semibold shadow-2xl" : ""
            } p-2 lg:p-4  rounded-t-xl transition-all`}
          >
            Sold Cars
          </button>
        </div>
        <Link
          to={`/dealer/add-Car`}
          className="rounded-md bg-black px-2 lg:px-3 py-1 lg:py-2 text-xs  lg:text-sm  font-semibold text-white shadow-lg hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          Add new car
        </Link>
      </div>

      <div
        className={`bg-white p-5 rounded-xl shadow-2xl ${
          activeTab == "AllCars" ? "rounded-ss-none" : ""
        }`}
      >
        <ul
          id="car-container"
          className="flex flex-col divide-y divide-gray-300 max-h-[100vh] overflow-auto "
        >
          {cars ? (
            cars.length == 0 ? (
              <div className="text-center">No Cars</div>
            ) : (
              cars.map((car) => (
                <li
                  key={car._id}
                  onClick={() => {
                    dispatch(updateSelectedCar(car));
                    navigate("/dealer/car-detail");
                  }}
                  className="flex flex-col sm:flex-row sm:justify-between px-6 py-5 hover:bg-[#E1E9FC60] transition-all cursor-pointer"
                >
                  <div className="flex w-full space-x-2 sm:space-x-4 ">
                    <div className=" relative overflow-hidden">
                      {/* {car?.bargain &&
                      !car?.sold &&
                      (activeTab == "AllCars" || activeTab == "ActiveCars") ? (
                        <div className=" absolute top-[10px] left-[-20px] bg-green-400 z-20 px-5 -rotate-45 font-semibold text-[12px] ">
                          Active
                        </div>
                      ) : activeTab == "Ongoing" ? (
                        <div className=" absolute top-[10px] left-[-20px] bg-yellow-400 z-20 px-5 -rotate-45 font-semibold text-[12px] ">
                          Bargain
                        </div>
                      ) : (
                        <div className=" absolute top-[10px] left-[-20px] bg-red-400 z-20 px-5 -rotate-45 font-semibold text-[12px] ">
                          Sold
                        </div>
                      )}
                      {car?.sold && activeTab == "AllCars" && (
                        <div className=" absolute top-[10px] left-[-20px] bg-red-400 z-20 px-5 -rotate-45 font-semibold text-[12px] ">
                          Sold
                        </div>
                      )} */}
                      {/* <div className=" absolute top-[10px] left-[-15px] bg-red-400 z-20 px-5 -rotate-45 font-semibold text-[8px] ">
                        sold
                      </div> */}
                      <div className="flex cursor-pointer items-center justify-center overflow-hidden rounded transition hover:opacity-75 ">
                        <img
                          alt={`${car.name}`}
                          src={car.image.main?.url || Car_img}
                          // width={100}
                          // height={100}
                          className="h-20 w-20 object-cover hover:scale-125 transition-all duration-300 md:h-24 md:w-24 lg:h-28 lg:w-28 xl:w-32"
                        />
                        {car?.sold ? (
                          <Ribbon tag="Sold" />
                        ) : (
                          car?.bargain && <Ribbon tag="Ongoing" />
                        )}
                      </div>
                    </div>

                    <div className="flex w-full flex-col justify-between pb-1">
                      <div className="flex w-full justify-between space-x-2">
                        <div className="space-y-1">
                          <h3 className="lg:text-xl text-sm font-semibold leading-snug sm:pr-8">
                            {car.name}
                          </h3>
                          <div className="flex gap-2">
                            <p className="lg:text-sm text-xs font-medium">
                              {car.type}
                            </p>
                            <p className="lg:text-sm text-xs font-medium">
                              {car.model}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="lg:text-lg text-base font-semibold">
                            ₹ {car.price.toLocaleString("en-In")}
                          </p>
                        </div>
                      </div>

                      {!car?.sold && (
                        <div className="flex divide-x lg:text-sm text-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(updateSelectedCar(car));
                              setDeleteOpen(true);
                            }}
                            className="flex items-center space-x-2 px-2 pl-0 hover:text-red-400"
                          >
                            <Trash size={16} />
                            <span>Remove</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(updateSelectedCar(car));
                              navigate("/dealer/edit-Car");
                            }}
                            className="flex items-center space-x-2 px-2 hover:text-blue-400"
                          >
                            <Pencil size={16} />
                            <span>Edit</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )
          ) : (
            <div className="w-full h-40vh flex items-center justify-center">
              <LoaderCircle className="rotate" />
            </div>
          )}
        </ul>
      </div>
      <Pagination page={page} setPage={setPage} items={user?.cars.length} />
      {deleteOpen && (
        <div
          onClick={() => setDeleteOpen(false)}
          className="absolute z-[100] top-0 left-0 w-full h-full flex justify-center items-center bg-[rgba(0,0,0,.3)]"
          style={{ top: window.scrollY + "px" }}
        >
          <DeleteCarDealerDialog setDeleteOpen={setDeleteOpen} />
        </div>
      )}
    </div>
  );
};

export default MyCars;
