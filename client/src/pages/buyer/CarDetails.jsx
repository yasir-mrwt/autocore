import { Heart, LoaderCircle } from "lucide-react";
import Car_img from "/assets/image/car_img1.png";
import User_icon from "/assets/icon/user_icon.svg";
import Type_icon from "/assets/icon/type_icon.svg";
import Conditioner_icon from "/assets/icon/conditioner_icon.svg";
import Door_icon from "/assets/icon/door_icon.svg";
import Card from "../../components/Card";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  asyncAddWatchList,
  // asyncDeleteReview,
  asyncDeleteWatchList,
  asyncMakePayment,
  asyncVerifyPayment,
} from "../../store/actions/carActions";
import {
  notifyError,
  notifyErrorPromise,
  // notifyErrorPromise,
  notifyInfo,
  notifyPendingPromise,
  notifySuccess,
  notifySuccessPromise,
} from "../../utils/Toast";
import { getSocket } from "../../utils/Socket";
import { addChat, updateSelectedChat } from "../../store/reducers/appReducer";
import useRazorpay from "react-razorpay";
import RatingAndReview from "../../components/RatingAndReview";
import Ribbon from "../../components/Ribbon";
import Rating from "@mui/material/Rating";
import { useMediaQuery } from "@mui/material";
import { loadStripe } from "@stripe/stripe-js";
import axiosInstance from "../../utils/Axios";

const CarDetail = () => {
  const [Razorpay] = useRazorpay();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, selectedCar, userType, isAuthenticated, allCars, watchList } =
    useSelector((state) => state.app);

  const [id, setId] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (id && msg?.includes("successfully")) notifySuccessPromise(id, msg);
    else if (id && msg) notifyErrorPromise(id, msg);
  }, [id, msg]);

  var socket = useRef(null);

  useEffect(() => {
    socket.current = getSocket();

    socket.current?.on("chat-created", (res) => {
      console.log(res);
      if (res.status == 200 || res.status == 201) {
        setMsg("Chat created successfully");
        dispatch(addChat(res.chat));
        dispatch(updateSelectedChat(res.chat));
      } else {
        console.log(res);
        setMsg(res.message);
      }
    });
  }, []);

  const [activeImage, setActiveImage] = useState(0);
  const [index, setIndex] = useState(-1);

  let images = [
    selectedCar?.image?.main?.url || Car_img,
    selectedCar?.image?.secondary?.url || Car_img,
    selectedCar?.image?.tertiary?.url || Car_img,
  ];

  const handleBargain = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      notifyInfo("Login to perform actions!");
      return navigate("/sign-in");
    }
    const data = {
      buyer_id: user._id,
      dealer_id: selectedCar.dealer_id._id,
      car_id: selectedCar._id,
      chat_name_buyer: `${selectedCar.name}(${selectedCar.model})`,
      chat_name_dealer: user.user_name,
    };

    const index = user.chat.findIndex(
      (chat) => chat.car_id?._id == selectedCar?._id
    );

    if (index == -1) {
      const id = notifyPendingPromise("Creating Chat...");
      setId(id);

      return getSocket().emit("create-chat", data);
    }
    dispatch(updateSelectedChat(user.chat[index]));
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      notifyInfo("Login to perfrom actions!");
      return navigate("/sign-in");
    }
    const id = notifyPendingPromise("Opening Payment Page...");
    console.log("buy now");
    // const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISH_KEY);
    const res = await dispatch(asyncMakePayment(selectedCar?._id, user?._id));
    console.log({ res });
    // const result = stripe.redirectToCheckout({ sessionId: res.data.id });
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY, // Enter the Key ID generated from the Dashboard
      amount: res.data.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
      currency: "INR",
      name: "AutoCore", //your business name
      description: "Test Transaction",
      image: selectedCar?.image?.main?.url,
      order_id: res.data.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
      handler: function (response) {
        dispatch(asyncVerifyPayment(response, selectedCar?._id)).then((res) => {
          const id = notifyPendingPromise("Verifying...");
          if (res == 200) {
            notifySuccessPromise(id, "Verified successfully!");
            navigate("/buyer/my-cars");
          } else {
            notifyErrorPromise(id, "Failed to verify!");
            notifyError(res.message);
          }
        });
        console.log({ response });
      },
      prefill: {
        //We recommend using the prefill parameter to auto-fill customer's contact information especially their phone number
        name: user?.user_name, //your customer's name
        email: user?.email,
        contact: "9000090000", //Provide the customer's phone number for better conversion rates
      },
      notes: {
        address: "Razorpay Corporate Office",
      },
      theme: {
        color: "#1572D3",
      },
    };
    const razor = new Razorpay(options);
    razor.open();
    notifySuccessPromise(id, "Opened successfully!");
  };

 
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      return;
      const scrollStep = -window.scrollY / (500 / 30); // adjust duration as needed
      const scrollInterval = setInterval(() => {
        if (window.scrollY !== 0) {
          window.scrollTo(0, window.scrollY + scrollStep);
        } else {
          clearInterval(scrollInterval);
        }
      }, 15); // scroll every 15 milliseconds
    };

    scrollToTop();

    const getIndex = selectedCar?.bargained?.findIndex(
      (bargain) => bargain.id === user?._id
    );

    console.log({ getIndex });

    setIndex(getIndex);
  }, [selectedCar]);

  const [buyPrice, setBuyPrice] = useState("");

  useEffect(() => {
    console.log({ buyPrice });
    let buyIndex = selectedCar?.bargained?.findIndex(
      (bargain) => bargain.id === user?._id
    );

    const price =
      buyIndex != -1
        ? selectedCar?.bargained[buyIndex]?.price
        : selectedCar?.price;

    setBuyPrice(price);
  }, []);

  return (
    <>
      {selectedCar ? (
        <div id="container" className=" container px-4 md:px-0">
          <div className="overflow-hidden md:mt-8">
            <div className="mb-9">
              <div className=" md:grid md:grid-cols-2 flex flex-col items-start gap-2">
                <div className="">
                  <div className="w-full flex flex-col md:flex-row-reverse gap-4">
                    <h2 className="md:text-[32px] md:hidden block text-xl font-semibold">
                      {selectedCar.name}({selectedCar.model})
                    </h2>
                    <div className="relative mb-2.5 overflow-hidden rounded-md border w-full md:min-h-[50vh]">
                      {/* <div className=" absolute top-[20px] left-[-25px] bg-red-400 z-20 px-10 -rotate-45 font-semibold text-base ">
                        Sold
                      </div> */}
                      <div className="relative flex items-center justify-center w-full h-full">
                        <img
                          alt="Product gallery 1"
                          src={images[activeImage]}
                          // width={650}
                          // height={590}
                          className="rounded-lg object-contain h-full w-full"
                        />
                        {selectedCar?.buyer_id ? (
                          selectedCar?.buyer_id == user?._id ? (
                            <Ribbon tag="Bought" />
                          ) : (
                            <Ribbon tag="Sold" />
                          )
                        ) : null}
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-2">
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

                <div className="flex shrink-0 w-full flex-col bg-white h-full rounded-xl px-2 lg:px-6 lg:pr-10">
                  <div className="flex items-start justify-between ">
                    <div className="pb-3">
                      <h2 className="md:text-[32px] hidden md:block text-3xl font-semibold">
                        {selectedCar.name}({selectedCar.model})
                      </h2>
                      <p className="mt-1 text-sm font-normal flex items-center gap-2">
                        <Rating
                          readOnly
                          value={selectedCar?.rating || 0}
                          precision={0.1}
                        />
                        <span className=" text-[#596780]">
                          ({selectedCar?.rating})
                        </span>
                        <span className=" text-[#596780]">
                          {selectedCar?.review?.length || 0} Reviewer
                        </span>
                      </p>

                      <p className="mt-1 text-[#596780] text-sm font-normal capitalize">
                        Dealer : {selectedCar?.dealer_id.user_name}
                      </p>
                    </div>
                    <div className="md:p-2 md:bg-white md:shadow-md cursor-pointer rounded-full mt-2 md:mt-0">
                      {!watchList?.includes(selectedCar?._id) ? (
                        <Heart
                          fill="#fff"
                          className=" text-gray-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              notifyInfo("Login to perform actions!");
                              return navigate("/sign-in");
                            }
                            dispatch(asyncAddWatchList(selectedCar?._id)).then(
                              (res) => {
                                if (res == 200)
                                  notifySuccess("Added to watch list!");
                                else notifyError("Error adding to watch list!");
                              }
                            );
                          }}
                        />
                      ) : (
                        <Heart
                          fill="#ED3F3F"
                          className=" text-[#ED3F3F]"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(
                              asyncDeleteWatchList(selectedCar?._id)
                            ).then((res) => {
                              if (res == 200)
                                notifySuccess("Deleted from watch list!");
                              else
                                notifyError("Error deleting from watch list!");
                            });
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <p className=" text-base text-[#596780] font-normal w-[90%] leading-7">
                    {selectedCar.description
                      ? selectedCar.description
                      : "No description!"}
                  </p>
                  <div className=" grid grid-cols-2 md:w-1/2 gap-x-10 pb-2 mt-2">
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
                        <span className=" text-sm font-normal text-[#959595] text-nowrap">
                          {info.content}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className=" flex items-center  justify-between">
                    {!selectedCar?.sold && (
                      <div className="  mt-2 flex flex-col">
                        {index != -1 &&
                        selectedCar.bargained[index]?.price != -1 ? (
                          <div className="flex flex-col items-center">
                            <span className=" text-[22px] font-semibold">
                              ₹{" "}
                              {selectedCar.bargained[
                                index
                              ]?.price?.toLocaleString("en-In")}
                            </span>
                            <span className=" text-[14px] line-through ">
                              ₹ {selectedCar.price.toLocaleString("en-In")}
                            </span>
                          </div>
                        ) : (
                          <span className=" text-[22px] font-semibold">
                            ₹ {selectedCar.price.toLocaleString("en-In")}
                          </span>
                        )}
                      </div>
                    )}

                    {/* {selectedCar?.buyer_id &&
                      selectedCar?.buyer_id != user?._id &&
                      "hey"} */}
                    {!selectedCar?.buyer_id ? (
                      <div className="flex flex-row gap-2">
                        {" "}
                        <button
                          onClick={handleBargain}
                          className="border border-black text-black w-fit px-3 py-1  lg:px-10 lg:py-2 transition-all hover:text-white hover:bg-black  rounded-lg mt-3"
                        >
                          Bargain
                        </button>
                        <button
                          onClick={handleBuyNow}
                          className="bg-[#1572D3] hover:bg-blue-500 transition-all w-fit px-3 py-1  lg:px-10 lg:py-2 text-white rounded-lg mt-3"
                        >
                          Buy Now
                        </button>
                      </div>
                    ) : selectedCar?.buyer_id == user?._id ? (
                      <p className="text-gray-700 text-lg mt-5">
                        Bought At : ₹ {buyPrice?.toLocaleString("en-IN")}
                      </p>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <RatingAndReview />

          {/* Recent Cars */}
          <div className=" container md:px-8 mt-0 mb-10">
            <div className=" flex items-center justify-between">
              <h4 className="md:text-[30px] text-2xl text-gray-800 mb-3 font-semibold capitalize pb-2">
                {userType != "Dealer" ? "Recent Parts" : "My Parts"}
              </h4>
              <h1
                onClick={() => {
                  navigate("/cars");
                }}
                className="cursor-pointer text-base font-medium text-[#3563E9] hover:underline"
              >
                View All
              </h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 mt-4">
              {
                // (userType !== "Dealer"
                //   ? allCars.slice(0, 5)
                //   : myCars.slice(0, 4)
                // )
                allCars
                  ?.filter((car) => car.sold != true)
                  ?.slice(0, 5)
                  ?.map((car, index) => {
                    if (car?._id == selectedCar?._id) return;

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
        </div>
      ) : (
        <div className="w-full p-[10vmax] flex justify-center">
          <LoaderCircle className="rotate" />
        </div>
      )}
    </>
  );
};

export default CarDetail;
