import { useEffect, useState } from "react";
import { CarCapacity, CarTypes } from "../../../constants";
import Card from "../../components/Card";
import { useLocation, useNavigate } from "react-router-dom";
import { asyncGetAllCars } from "../../store/actions/carActions";
import { useDispatch, useSelector } from "react-redux";
import { notifyError } from "../../utils/Toast";
import Pagination from "../../components/Pagination";

const Cars = () => {
  const [type, setType] = useState(() => CarTypes.map(() => false));
  const [capacity, setCapacity] = useState(() => CarCapacity.map(() => false));

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { allCars } = useSelector((state) => state.app);

  const { pathname, search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const [page, setPage] = useState(searchParams.get("page") || 1);

  useEffect(() => {
    const filteredTypes = CarTypes.filter((_, index) => type[index]);
    const filteredCapacities = CarCapacity.filter(
      (_, index) => capacity[index]
    );

    // console.log("Selected Types:", filteredTypes);
    // console.log("Selected Capacities:", filteredCapacities);

    let queryParams = `?page=${page}`;

    if (filteredTypes.length > 0) {
      queryParams += `&type=${filteredTypes.join(",")}`;
    }

    if (filteredCapacities.length > 0) {
      queryParams += `&capacities=${filteredCapacities.join(",")}`;
    }

    navigate(pathname + queryParams);

    dispatch(asyncGetAllCars(queryParams.slice(1)));
  }, [type, capacity]);

  const handleTypeCheckbox = (index) => {
    setType((prevTypes) => {
      const newTypes = [...prevTypes];
      newTypes[index] = !newTypes[index];
      return newTypes;
    });
  };

  const handleCapacityCheckbox = (index) => {
    setCapacity((prevTypes) => {
      const newTypes = [...prevTypes];
      newTypes[index] = !newTypes[index];
      return newTypes;
    });
  };

  useEffect(() => {
    navigate(`${pathname}?page=${page}`);

    dispatch(asyncGetAllCars(page)).then((res) => {
      if (res == 200) console.log("successfully fetched all cars");
      else notifyError(res.message);
    });
  }, [page]);

  return (
    <div className="relative">
      {/* <div className=" container px-10 pb-4">
        <h1 className=" text-[38px] font-medium text-black text-center">
        Most popular cars cars
      </h1>
        <div className="flex items-start justify-between gap-5">
          <div className=" sticky top-0 left-0 bg-white shadow-md w-[20%]  min-h-fit flex flex-col px-6 py-4 mt-4 rounded-2xl mb-20">
            TYPE
            <div className="flex flex-col">
              <span className="text-black  font-semibold text-xl mb-3">
                Type
              </span>
              {CarTypes.map((val, index) => {
                return (
                  <span
                    className="cursor-pointer flex gap-2 mb-3 text-base font-medium"
                    onClick={() => handleTypeCheckbox(index)}
                    key={index}
                  >
                    <input
                      type="checkbox"
                      onChange={() => handleTypeCheckbox(index)}
                      checked={type[index]}
                      className="cursor-pointer"
                    />
                    {val}
                  </span>
                );
              })}
            </div>
            CAPACITY
            <div className="flex flex-col">
              <span className="  font-semibold text-xl text-black mt-5 mb-3 capitalize">
                Capacity
              </span>
              {CarCapacity.map((val, index) => {
                return (
                  <span
                    className="cursor-pointer flex gap-2 mb-3 text-base font-medium"
                    onClick={() => handleCapacityCheckbox(index)}
                    key={index}
                  >
                    <input
                      type="checkbox"
                      onChange={() => handleCapacityCheckbox(index)}
                      checked={capacity[index]}
                      className="cursor-pointer p-1"
                    />
                    {val}
                  </span>
                );
              })}
            </div>
            PRICE
            <div className="flex flex-col">
              <span className="text-gray-500 text-sm mt-5 mb-3">PRICE</span>
            </div>
          </div>

          <div
            id="car-container"
            className=" overflow-y-scroll h-screen pb-5 no-scrollbar"
          >
            <div className="grid grid-cols-3 gap-7 mt-4">
              {allCars?.map((car, index) => {
                if (car.sold) return;
                return <Card key={index} car={car} />;
              })}
            </div>
          </div>
        </div>
        <Pagination
          page={page}
          setPage={setPage}
          items={allCars?.length}
          showItems={20}
        />
      </div> */}

      <div className="container px-2 mb-20">
        {/* Category filter */}
        {/* <div className="md:w-[20%] border-[1px] border-gray-200 px-3 py-4 rounded-md hidden md:block">
          {categories.map((category, index) => (
            <CategoryFilter key={index} category={category} />
          ))}
        </div> */}

        <h1 className=" md:text-[38px] text-2xl md:ml-0 font-medium text-black mb-4">
          Most popular cars
        </h1>

        <div className="flex items-start justify-between mt-0 md:mt-8  md:space-x-5">
          <div className="hidden md:flex sticky top-0 left-0 w-[16%] text-xs lg:text-sm min-h-fit flex-col px-2 lg:px-4 py-2 rounded-md pb-2 mb-3 border-2 border-gray-200">
            {/* TYPE */}
            <div className="flex flex-col pb-3 border-b-[2px] border-gray-200">
              <span className="text-black  font-semibold text-base lg:text-lg mb-2">
                Type
              </span>
              {CarTypes.map((val, index) => {
                return (
                  <span
                    className="cursor-pointer flex gap-2 mb-2 font-medium ml-3"
                    onClick={() => handleTypeCheckbox(index)}
                    key={index}
                  >
                    <input
                      type="checkbox"
                      onChange={() => handleTypeCheckbox(index)}
                      checked={type[index]}
                      className="cursor-pointer"
                    />
                    {val}
                  </span>
                );
              })}
            </div>
            {/* CAPACITY */}
            <div className="flex flex-col">
              <span className="  font-semibold text-base lg:text-lg text-black mt-3 mb-2 capitalize">
                Capacity
              </span>
              {CarCapacity.map((val, index) => {
                return (
                  <span
                    className="cursor-pointer flex gap-2 mb-2 font-medium ml-3"
                    onClick={() => handleCapacityCheckbox(index)}
                    key={index}
                  >
                    <input
                      type="checkbox"
                      onChange={() => handleCapacityCheckbox(index)}
                      checked={capacity[index]}
                      className="cursor-pointer p-1"
                    />
                    {val}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Product Listing */}
          <div
            id="car-container"
            className="md:w-[86%] flex items-center flex-col  overflow-y-scroll no-scrollbar h-screen pb-52"
          >
            {/* Products */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-7 sm:gap-4 md:gap-x-3 md:gap-y-7">
              {/* {allCars?.map((product, index) => (
              <div key={index} className="mb-5 flex-1 flex-grow flex">
                <Card
                  product={product}
                  // isProductInWishlist={isProductInWishlist(product.product_id)}
                />
              </div>
            ))} */}

              {allCars?.map((car, index) => {
                if (car.sold) return;
                return <Card key={index} car={car} />;
              })}
            </div>

            {/* Pagination */}
            {/* <div className="flex items-center mt-10">
            <a
              href="#"
              className="mx-1 cursor-not-allowed text-sm font-semibold text-gray-900"
            >
              &larr; Previous
            </a>
            <a
              href="#"
              className="mx-1 flex items-center rounded-md border border-gray-400 px-3 py-1 text-gray-900 hover:scale-105"
            >
              1
            </a>
            <a
              href="#"
              className="mx-1 flex items-center rounded-md border border-gray-400 px-3 py-1 text-gray-900 hover:scale-105"
            >
              2
            </a>
            <a
              href="#"
              className="mx-1 flex items-center rounded-md border border-gray-400 px-3 py-1 text-gray-900 hover:scale-105"
            >
              3
            </a>
            <a
              href="#"
              className="mx-1 flex items-center rounded-md border border-gray-400 px-3 py-1 text-gray-900 hover:scale-105"
            >
              4
            </a>
            <a href="#" className="mx-2 text-sm font-semibold text-gray-900">
              Next &rarr;
            </a>
          </div> */}

            <Pagination
              page={page}
              setPage={setPage}
              items={allCars?.length ?? 0}
              showItems={20}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cars;
