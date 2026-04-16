import { LoaderCircle, Pencil, Trash } from "lucide-react";
import Car_img from "/assets/image/car_img1.png";
import User_icon from "/assets/icon/user_icon.svg";
import Type_icon from "/assets/icon/type_icon.svg";
import Conditioner_icon from "/assets/icon/conditioner_icon.svg";
import Door_icon from "/assets/icon/door_icon.svg";
import Card from "../../components/Card";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateSelectedCar } from "../../store/reducers/appReducer";
import { Rating } from "@mui/material";
import RatingAndReview from "../../components/RatingAndReview";

const CarDetailDealer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedCar, myCars, user } = useSelector((state) => state.app);

  const [activeImage, setActiveImage] = useState(0);
  const [index, setIndex] = useState(-1);

  let images = [
    selectedCar?.image?.main?.url || Car_img,
    selectedCar?.image?.secondary?.url || Car_img,
    selectedCar?.image?.tertiary?.url || Car_img,
  ];

  useEffect(() => {
    const scrollToTop = () => {
      const scrollStep = -window.scrollY / (500 / 30); // adjust duration as needed
      const scrollInterval = setInterval(() => {
        if (window.scrollY !== 0) {
          window.scrollBy(0, scrollStep);
        } else {
          clearInterval(scrollInterval);
        }
      }, 15); // scroll every 15 milliseconds
    };

    scrollToTop();

    const getIndex = selectedCar?.bargained?.findIndex(
      (bargain) => bargain.id === user._id
    );

    console.log({ getIndex });

    setIndex(getIndex);
  }, [selectedCar]);

  useEffect(() => {
    console.log({ index });
  }, [index]);

  return (
    <div
      id="message-container"
      className="h-screen overflow-x-hidden overflow-y-auto"
    >
      {!selectedCar ? (
        <div className="w-full p-[10vmax] flex justify-center">
          <LoaderCircle className="rotate" />
        </div>
      ) : (
        <div id="container" className=" container">
          <div className="overflow-hidden mt-8">
            <div className="mb-9">
              <div className=" grid grid-cols-2 items-start gap-2">
                {/* <div className="items-center justify-center h-full overflow-hidden md:mb-8 lg:mb-0 xl:flex">
                  <div className="w-full gap-2 xl:flex xl:flex-row-reverse">
                    <div className=" relative">
                      <div className="relative flex items-center justify-center">
                        <img
                          alt="active image"
                          src={images[activeImage]}
                          width={650}
                          height={590}
                          className="rounded-lg object-cover"
                        />
                      </div>
                      <div className="absolute top-2/4 z-10 flex w-full items-center justify-between">
                        <ChevronLeft
                          onClick={handleLeft}
                          className="text-white bg-[rgba(0,0,0,.5)] hover:bg-[rgba(0,0,0,.7)]  rounded-full transition-all cursor-pointer "
                        />
                        <ChevronRight
                          onClick={handleRight}
                          className="text-white transition-all cursor-pointer rounded-full bg-[rgba(0,0,0,.5)] hover:bg-[rgba(0,0,0,.7)]"
                        />
                      </div>
                    </div>
                    <div className=" flex flex-col gap-4">
                      {images.map((image, index) => (
                        <div
                          key={image}
                          className={`  flex cursor-pointer items-center  justify-center overflow-hidden rounded border-4 transition hover:opacity-75 ${
                            activeImage == index && "border-red-500"
                          }`}
                        >
                          <img
                            alt={`Product ${index}`}
                            onClick={() => setActiveImage(index)}
                            src={image}
                            decoding="async"
                            loading="lazy"
                            className=" h-full w-28 object-cover aspect-square rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div> */}

                <div className="">
                  <div className="w-full flex flex-row-reverse gap-4">
                    <div className="relative mb-2.5 overflow-hidden rounded-md border w-full min-h-[20vh] lg:min-h-[50vh]">
                      <div className=" absolute top-[20px] left-[-25px] bg-red-400 z-20 px-10 -rotate-45 font-semibold text-base ">
                        Sold
                      </div>
                      <div className="relative flex items-center justify-center w-full h-full">
                        <img
                          alt="Product gallery 1"
                          src={images[activeImage]}
                          // width={650}
                          // height={590}
                          className="rounded-lg object-contain h-full w-full"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {images.map((image, index) => (
                        <div key={index} className=" relative overflow-hidden">
                          {/* <div className=" absolute top-[10px] left-[-15px] bg-red-400 z-20 px-5 -rotate-45 font-semibold text-[8px] ">
                            sold
                          </div> */}
                          <div
                            onMouseEnter={() => setActiveImage(index)}
                            key={index}
                            className="flex cursor-pointer items-center justify-center overflow-hidden rounded transition hover:opacity-75 "
                          >
                            <img
                              alt={`Product ${index}`}
                              src={image}
                              // width={100}
                              // height={100}
                              className="h-20 w-20 object-cover md:h-24 md:w-24 lg:h-28 lg:w-28 xl:w-32"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col h-full rounded-xl px-6 pr-10">
                  <div className="flex items-start justify-between ">
                    <div className="pb-3">
                      <h2 className="lg:text-[32px] text-[16px] font-semibold">
                        {selectedCar.name} {selectedCar.model}
                      </h2>
                      <p className="mt-1 text-sm font-normal flex flex-col lg:flex-row lg:items-center gap-2">
                        <span className="flex items-center">
                          <Rating
                            readOnly
                            value={selectedCar?.rating || 0}
                            precision={0.1}
                          />
                          <span className=" text-[#596780]">
                            ({selectedCar?.rating})
                          </span>
                        </span>
                        <span className=" text-[#596780]">
                          {selectedCar?.review?.length || 0} Reviewer
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="hidden lg:block text-base text-[#596780] font-normal w-[70%] leading-7">
                    {selectedCar.description
                      ? selectedCar.description
                      : "No description!"}
                  </p>

                  <div className=" grid grid-cols-1 lg:grid-cols-2 w-1/2 gap-x-10 pb-2 mt-2">
                    {[
                      {
                        icon: User_icon,
                        content: `${selectedCar.capacity} Passengers`,
                      },
                      {
                        icon: Type_icon,
                        content: selectedCar.transmission || "NA",
                      },
                      {
                        icon: Conditioner_icon,
                        content: selectedCar.air_conditioner ? "AC" : "Non Ac",
                      },
                      {
                        icon: Door_icon,
                        content: `${selectedCar.door || "NA"} Doors`,
                      },
                    ].map((info, index) => (
                      <div key={index} className="flex items-center gap-2 mt-3">
                        <img src={info.icon} alt="" />
                        {/* <span className=" text-sm font-normal text-[#959595] text-nowrap">
                      {info.title}
                    </span> */}
                        <span className="text-xs lg:text-sm font-normal text-[#959595] text-nowrap">
                          {info.content}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className=" flex  items-center justify-between">
                    <div className="  mt-2 ">
                      <span className="text-[15px] lg:text-[22px] font-semibold">
                        ₹ {selectedCar.price.toLocaleString("en-In")}
                      </span>
                    </div>

                    {!selectedCar?.sold && (
                      <div className="flex flex-col lg:flex-row lg:divide-x text-xs lg:text-sm">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("remove clicked");
                          }}
                          className="flex items-center space-x-2  lg:px-2 py-1 pl-0 hover:text-red-400"
                        >
                          <Trash size={16} />
                          <span>Remove</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(updateSelectedCar(selectedCar));
                            navigate("/dealer/edit-Car");
                          }}
                          className="flex items-center space-x-2 lg:px-2 py-1 hover:text-blue-400"
                        >
                          <Pencil size={16} />
                          <span>Edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:hidden block lg:text-base text-sm text-[#596780] font-normal w-full leading-7">
            {selectedCar.description
              ? selectedCar.description
              : "No description!"}
          </div>

          {/* REVIEW
          <div
            id="car-container"
            className="w-[90%]  max-h-[40vh] overflow-y-auto mx-auto mb-20 border bg-gray-100 text-gray-700 font-semibold text-lg rounded-lg p-3 pt-0"
          >
            <h3 className="sticky pt-1 top-0 bg-gray-100">Reviews</h3>
            {selectedCar?.review.map((review) => {
              // console.log({ review });
              return (
                <div
                  className="text-base mt-1 mb-2 bg-white rounded-lg p-2 font-normal"
                  key={review?._id}
                >
                  <div className="flex items-center gap-1">
                    {" "}
                    <CircleUser size={16} />
                    <p className="capitalize flex-[.1]">
                      {review?.buyer_id?.user_name}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <p className="my-1 flex-[0.1] ">⭐ {review.rating}</p>
                    <p
                      className={`text-sm flex-[0.9] ${
                        !review.comment && "text-gray-400"
                      }`}
                    >
                      {review.comment || "No comments"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div> */}
          <RatingAndReview />

          <div className=" container px-8 mt-0 mb-10">
            <div className=" flex items-center justify-between">
              <h4 className="text-[30px] text-gray-800 mb-3 font-semibold capitalize pb-2">
                My Parts
              </h4>
              <h1
                onClick={() => {
                  navigate("/dealer/my-cars");
                }}
                className="cursor-pointer text-base font-medium text-[#3563E9] hover:underline"
              >
                View All
              </h1>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-7 mt-4">
              {
                // (userType !== "Dealer"
                //   ? allCars.slice(0, 5)
                //   : myCars.slice(0, 4)
                // )
                myCars
                  ?.filter((car) => car?._id != selectedCar?._id)
                  .slice(0, 4)
                  ?.map((car, index) => {
                    let watchList = false;

                    if ((user?.watch_list || []).includes(car?._id))
                      watchList = true;

                    return (
                      <Card car={car} isWishlist={watchList} key={index} />
                    );
                  })
              }
            </div>
          </div>

          {/* <div className=" container mt-20">
            <div className=" flex items-center justify-between">
              <h1 className=" text-xl font-medium text-black">My Cars</h1>
              <h1
                onClick={() => {
                  navigate("/dealer/my-cars");
                }}
                className=" text-base font-medium text-[#3563E9] cursor-pointer hover:underline"
              >
                View All
              </h1>
            </div>
            <div className="grid grid-cols-4 gap-7 mt-4">
              {myCars?.slice(0, 4)?.map((car, index) => {
                if (car?._id == selectedCar._id) return;
                return <Card car={car} key={index} />;
              })}
            </div>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default CarDetailDealer;
