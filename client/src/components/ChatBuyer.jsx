import { Badge } from "@mui/material";
import { Bell, CircleX, MessageSquareMore, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  acceptPrice,
  addMessage,
  addPrice,
  rejectPrice,
  updateSelectedCar,
  updateSelectedChat,
} from "../store/reducers/appReducer";
import { getSocket, sendMessage, sendPrice } from "../utils/Socket";
import { notifyInfo } from "../utils/Toast";
import { useNavigate } from "react-router-dom";
import CarImage from "/assets/image/car_img1.png";

const ChatBuyer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, selectedChat, unreadChat, allCars } = useSelector(
    (state) => state.app
  );

  const chatRef = useRef(null);
  const messageContainerRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [chat, setChat] = useState("bargain");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        if (event.target.id == "chat") {
          console.log("chat");
          return;
        } else setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the message container
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }

    if (selectedChat) {
      setIsOpen(true);
    }
  }, [selectedChat, chat]);

  useEffect(() => {
    if (!isOpen) dispatch(updateSelectedChat(null));
  }, [isOpen]);

  const handleSend = () => {
    const messageInput = document.getElementById("message");

    if (!messageInput.value) {
      return console.log("Message empty cannot proceed!");
    }

    const data = {
      chat_id: selectedChat._id,
      car_id: selectedChat.car_id._id,
      sender: user._id,
      receiver: selectedChat.dealer_id,
      message: messageInput.value,
    };
    sendMessage(data);
    getSocket().on("message-sent", (res) => {
      if (res.status == 200) {
        dispatch(addMessage(data));
        messageInput.value = "";
      }
    });
  };

  const handleSendPrice = () => {
    const priceInput = document.getElementById("price");

    if (!priceInput.value) {
      return console.log("Price empty cannot proceed!");
    }

    const status = selectedChat?.last_bargain?.status;

    if (status == "Ongoing") return notifyInfo("Last Bargain Status Ongoing!");

    const data = {
      chat_id: selectedChat._id,
      car_id: selectedChat.car_id._id,
      sender: user._id,
      receiver: selectedChat.dealer_id,
      price: priceInput.value,
    };

    sendPrice(data);
    getSocket().on("price-sent", (res) => {
      if (res.status == 200) {
        dispatch(addPrice(res.bargain));
        priceInput.value = "";
      }
    });
  };

  return (
    <div
      ref={chatRef}
      className={`${
        isOpen ? "w-[95vw] md:w-[70vw] lg:w-[45vw]" : "w-[25vw] lg:w-[15vw]"
      } text-white z-[9999] p-1 transition-all rounded-md w-[20vw] fixed bottom-0 lg:bottom-2 right-2`}
    >
      <div
        id="chat"
        style={{ boxShadow: "0px 2px 5px rgba(0,0,0,.5)" }}
        className="bg-[#0e4e92] p-2 rounded-md mb-2 flex justify-between items-center cursor-pointer border border-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="flex md:hidden text-xs items-center gap-2">Chat</h3>
        <h3 className="md:flex hidden items-center gap-2">
          {" "}
          <MessageSquareMore size={16} /> Chat
        </h3>
        <div className="flex gap-3">
          <Badge badgeContent={unreadChat?.length} color="secondary">
            <div className="hidden md:block">
              <Bell size={20} />
            </div>
            <div className="block md:hidden">
              <Bell size={15} />
            </div>
          </Badge>
          {isOpen && <CircleX size={20} />}
        </div>
      </div>

      <div
        id="car-container"
        style={{ boxShadow: "0px 2px 10px rgba(0,0,0,.5)" }}
        className={`w-[95%] mx-auto overflow-y-scroll bg-gray-100  text-black m-1 rounded-md ${
          isOpen ? "scale-1 h-[55vh]" : "scale-0 h-0 "
        } transition-all flex divide-x divide-gray-300 p-1`}
      >
        <div
          id="car-container"
          className="lg:flex-[0.3] flex-[.4] p-1 divide-y-2 divide-gray-200 overflow-y-scroll overflow-x-hidden"
        >
          {/* ALL CHATS */}
          {user?.chat.map((chat) => {
            const isUnread =
              chat.message &&
              chat?.messages[chat?.messages?.length - 1]?.sender == user?._id
                ? false
                : chat.unread;
            return (
              <div
                onClick={() => {
                  dispatch(updateSelectedChat(chat));
                }}
                key={chat._id}
                className={`lg:text-sm md:text-xs text-[2vmin] max-h-[10vmax] lg:max-h-[7vmax] grid gap-2 grid-rows-2 grid-cols-2 p-1 hover:bg-gray-200 transition-all rounded-md  hover:scale-100 cursor-pointer ${
                  selectedChat?._id == chat?._id
                    ? " bg-gray-300 scale-100"
                    : "scale-90 "
                }`}
              >
                <div className="col-start-1 row-start-1   row-span-2 border bg-white border-red-500 rounded-md">
                  <img
                    src={chat?.car_id?.image.main.url ?? CarImage}
                    alt="car_img"
                    className="h-full w-full object-contain rounded-md"
                  />
                </div>
                <span
                  className="col-start-2 overflow-ellipsis overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {chat?.chat_name_buyer}
                </span>
                <span className="row-start-2 col-start-2 lg:text-xs">
                  <p
                    className="row-start-2 col-start-2 lg:text-xs overflow-hidden overflow-ellipsis"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {chat?.last_message || "No messages"}{" "}
                  </p>

                  {(unreadChat?.includes(chat?._id) || isUnread) && (
                    <span className="ml-auto text-xs text-green-600 font-semibold">
                      Unread
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        {/* CHAT-AREA */}
        <div className="lg:flex-[0.7] flex-[.6] bg-gray-100 px-1">
          {!selectedChat ? (
            <div className="w-full h-full flex gap-3 flex-col text-base items-center justify-center">
              Start Chatting!{" "}
              <span className="text-xs text-center">
                And Grab yourself an amazing deal!
              </span>
              <MessageSquareMore size={26} className="text-blue-700" />
            </div>
          ) : (
            <div className="w-full cursor-pointer h-full flex flex-col overflow-y-hidden lg:text-base md:text-sm text-xs">
              <div
                onClick={() => {
                  const carIndex = allCars?.findIndex(
                    (car) => car._id == selectedChat.car_id._id
                  );
                  console.log({ carIndex });
                  const car = allCars[carIndex];
                  console.log({ car });
                  dispatch(updateSelectedCar(car));
                  navigate("/car-detail");
                  setIsOpen(false);
                }}
                className=" flex-[0.1] flex p-1 gap-2 items-center bg-[#0e4e92] text-white rounded-md"
              >
                <div className="h-[3vmax] w-[3vmax] rounded-full overflow-hidden bg-white border border-red-400">
                  <img
                    src={selectedChat?.car_id?.image?.main?.url ?? CarImage}
                    alt="car_img"
                    className="h-full w-full object-contain rounded-md"
                  />
                </div>
                <span className="lg:text-base md:text-sm text-xs">
                  {selectedChat?.chat_name_buyer}
                </span>
              </div>
              <div
                id="message-container"
                ref={messageContainerRef}
                className="flex-[0.9] relative  flex overflow-y-scroll flex-col bg-gray-200"
              >
                {/* //Messages */}
                <div className="sticky flex justify-center py-1 divide-x-2 divide-gray-400 top-0 left-0 w-full bg-gray-100">
                  <span
                    onClick={() => setChat("bargain")}
                    className={`px-5 cursor-pointer text-gray-400 lg:text-base md:text-sm text-xs ${
                      chat == "bargain" && "underline text-gray-600"
                    }`}
                  >
                    Bargain
                  </span>
                  <span
                    onClick={() => setChat("chat")}
                    className={`px-5 cursor-pointer text-gray-400 lg:text-base md:text-sm text-xs ${
                      chat == "chat" && "underline text-gray-600"
                    }`}
                  >
                    Chat
                  </span>
                </div>
                {chat == "chat" ? (
                  <div
                    id="car-container"
                    className="flex-1 flex flex-col gap-2 lg:text-base md:text-sm text-xs  p-2"
                  >
                    {selectedChat?.messages.map((message) => {
                      if (message.sender == user?._id) {
                        return (
                          <div
                            key={message._id}
                            className="bg-white  ml-auto p-2 rounded-xl rounded-ee-none text-[2vmin]   md:text-xs"
                          >
                            {message.message}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={message._id}
                          className="bg-blue-600  mr-auto  md:text-xs text-[2vmin] text-white  p-2 rounded-xl rounded-es-none"
                        >
                          {message.message}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // BARGAIN
                  <div
                    id="car-container"
                    className="flex-1 flex flex-col gap-2  md:text-xs text-[2vmin] p-2"
                  >
                    {/* {!user?.cars?.includes(selectedChat?.car_id?._id) ? ( */}
                    {!allCars?.find(
                      (car) => car._id == selectedChat?.car_id?._id
                    )?.buyer_id ? (
                      selectedChat?.bargain?.map((bargain, index) => {
                        const car = allCars?.find(
                          (car) => car._id == selectedChat?.car_id?._id
                        );
                        console.log({ car });
                        if (car?.buyer_id && car?.buyer_id != user?._id)
                          return (
                            <p
                              key={index}
                              className="h-full w-full flex items-center justify-center text-base"
                            >
                              Car has been sold
                            </p>
                          );
                        if (bargain.sender == user?._id) {
                          return (
                            <div
                              key={bargain._id || index}
                              className="bg-white  md:text-xs text-[2vmin] flex flex-col gap-1 items-center  p-2 rounded-xl text-center"
                            >
                              <p>
                                My Offer : ₹{" "}
                                {bargain.price.price?.toLocaleString("en-In")}
                              </p>
                              <span
                                className={` ${
                                  bargain.price.status == "Ongoing"
                                    ? "bg-transparent"
                                    : bargain.price.status == "Accepted"
                                    ? "bg-green-300"
                                    : "bg-red-300"
                                } p-1 text-gray-600  md:text-xs text-[2vmin] rounded-md`}
                              >
                                {bargain.price.status == "Ongoing"
                                  ? "No Reply"
                                  : bargain.price.status == "Accepted"
                                  ? "Accepted"
                                  : "Rejected"}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={bargain._id || index}
                            className="bg-white  md:text-xs text-[2vmin] flex flex-col gap-1 items-center  p-2 rounded-xl text-center"
                          >
                            <p>
                              Dealer Offer : ₹{" "}
                              {bargain?.price?.price?.toLocaleString("en-In")}
                            </p>
                            {bargain?.price?.status == "Ongoing" ? (
                              <div className="text-xs flex gap-2">
                                {" "}
                                <span
                                  onClick={() => {
                                    console.log(bargain._id);
                                    getSocket().emit(
                                      "price-accept",
                                      bargain._id
                                    );
                                    getSocket().on("price-accepted", (data) => {
                                      console.log("price-accepted", data);
                                      data.status == 200 &&
                                        dispatch(acceptPrice(data.bargain));
                                    });
                                  }}
                                  className="bg-green-300 hover:bg-green-200 transition-all cursor-pointer p-1 rounded-md text-gray-600"
                                >
                                  Accept
                                </span>
                                <span
                                  onClick={() => {
                                    console.log(bargain._id);
                                    getSocket().emit(
                                      "price-reject",
                                      bargain._id
                                    );
                                    getSocket().on("price-rejected", (data) => {
                                      console.log("price-rejected", data);
                                      data.status == 200 &&
                                        dispatch(rejectPrice(data.bargain));
                                    });
                                  }}
                                  className="bg-red-300 p-1 cursor-pointer hover:bg-red-200 transition-all rounded-md text-gray-600"
                                >
                                  Reject
                                </span>{" "}
                              </div>
                            ) : (
                              <p
                                className={`${
                                  bargain?.price?.status == "Rejected"
                                    ? "text-red-400"
                                    : "text-green-400"
                                } lg:text-base md:text-xs text-[2vmin]`}
                              >
                                You {bargain?.price?.status} the bargain
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : allCars?.find(
                        (car) => car._id == selectedChat?.car_id?._id
                      )?.buyer_id == user?._id ? (
                      <p className="h-full w-full flex items-center justify-center text-base">
                        Car has been bought
                      </p>
                    ) : (
                      <p className="h-full w-full flex items-center justify-center text-base">
                        Car has been sold
                      </p>
                    )}
                  </div>
                )}
                {/* Send Message */}
              </div>
              {chat == "chat" ? (
                <div className="bg-white flex gap-2 justify-between items-center p-1 rounded-md">
                  <input
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSend();
                      }
                    }}
                    autoComplete="off"
                    id="message"
                    className="flex-1 border-none outline-none p-2 text-sm"
                    type="text"
                    placeholder="Type your message!!!"
                  />
                  <Send
                    onClick={handleSend}
                    className="text-blue-700 cursor-pointer"
                  />
                </div>
              ) : !user?.cars?.includes(selectedChat?.car_id?._id) ? (
                selectedChat?.last_bargain?.status == "Accepted" ? (
                  <div className="p-2 text-center text-base text-green-600">
                    Deal Closed
                  </div>
                ) : (
                  <div className="bg-white flex gap-2 justify-between items-center p-1 rounded-md">
                    <input
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSendPrice();
                        }
                      }}
                      autoComplete="off"
                      id="price"
                      className="flex-1 border-none outline-none p-2 text-sm"
                      type="Number"
                      placeholder="Type Price!!!"
                    />
                    <Send
                      onClick={handleSendPrice}
                      className="text-blue-700 cursor-pointer"
                    />
                  </div>
                )
              ) : (
                <div className="p-2 text-center text-base text-green-600">
                  Deal Closed
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBuyer;
