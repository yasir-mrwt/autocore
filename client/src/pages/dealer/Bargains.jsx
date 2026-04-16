import { useEffect, useRef, useState } from "react";
import { getSocket, sendMessage, sendPrice } from "../../utils/Socket";
import { useDispatch, useSelector } from "react-redux";
import { MessageSquareMore, Send } from "lucide-react";
import {
  acceptPrice,
  addMessage,
  addPrice,
  rejectPrice,
  updateSelectedCar,
  updateSelectedChat,
} from "../../store/reducers/appReducer";
import { notifyInfo } from "../../utils/Toast";
import CarImg from "/assets/image/car_img1.png";
import { useNavigate } from "react-router-dom";

const Bargains = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const messageContainerRef = useRef(null);

  const { selectedChat, user, unreadChat, allCars } = useSelector(
    (state) => state.app
  );
  const [chat, setChat] = useState("bargain");

  useEffect(() => {
    document.title = "Bargains";
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the message container
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [selectedChat, chat]);

  const handleSend = () => {
    const messageInput = document.getElementById("message");

    if (!messageInput.value) {
      return console.log("Message empty cannot proceed!");
    }

    const data = {
      chat_id: selectedChat._id,
      car_id: selectedChat.car_id._id,
      sender: user._id,
      receiver: selectedChat.buyer_id,
      message: messageInput.value,
    };
    sendMessage(data);
    dispatch(addMessage(data));

    messageInput.value = "";
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
      receiver: selectedChat.buyer_id,
      price: priceInput.value,
    };

    sendPrice(data);
    getSocket()?.on("price-sent", (res) => {
      if (res.status == 200) {
        dispatch(addPrice(res.bargain));
        priceInput.value = "";
      }
    });
  };

  return (
    <div className="h-[85vh] lg:h-[90vh] p-5 flex gap-2">
      {/* Chats */}
      <div
        id="message-container"
        style={{ boxShadow: "0px 5px 5px rgba(0,0,0, 0.3)" }}
        className="flex-[.3] bg-gray-100 overflow-y-scroll relative rounded-xl p-2 pt-0 divide-y-2 divide-gray-200"
      >
        <h3 className="lg:text-lg text-base font-semibold  sticky  z-50 top-0 left-0 bg-[#0e4e92]  text-white p-2 lg:p-3 rounded-lg">
          Chats
        </h3>
        {user?.chat.map((chat) => {
          const isUnread =
            chat.messages[chat.messages.length - 1]?.sender == user?._id
              ? false
              : chat.unread;

          return (
            <div
              onClick={() => {
                dispatch(updateSelectedChat(chat));
              }}
              key={chat._id}
              className={`text-sm max-h-[10vmax] grid gap-2 grid-rows-2 grid-cols-2 p-1 hover:bg-gray-200 transition-all rounded-md  hover:scale-100 cursor-pointer ${
                selectedChat?._id == chat?._id
                  ? " bg-gray-300 scale-100"
                  : "scale-90 "
              }`}
            >
              <div className="col-start-1 row-start-1  row-span-2 border bg-white border-red-500 rounded-md">
                <img
                  src={chat?.car_id?.image?.main?.url || CarImg}
                  alt="car_img"
                  className="h-full w-full object-contain rounded-md"
                />
              </div>
              <span
                className="col-start-2 text-xs capitalize overflow-hidden overflow-ellipsis"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {chat?.chat_name_dealer} ({chat?.chat_name_buyer})
              </span>
              <span className="row-start-2 whitespace-nowrap overflow-hidden overflow-ellipsis flex flex-col col-start-2 text-xs">
                {chat?.last_message ? (
                  chat?.last_message
                ) : (
                  <span className="text-[1.5vmin] text-slate-400">
                    No Last Message
                  </span>
                )}{" "}
                  {/* <span className="text-[1.3vmin]  lg:text-[1.5vmin] text-green-600 font-semibold">
                    Unread
                  </span> */}
                {(unreadChat?.includes(chat?._id) || isUnread) && (
                  <span className="text-[1.3vmin] lg:text-[1.5vmin] text-green-600 font-semibold">
                    Unread
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {/* Message Container */}
      <div
        style={{ boxShadow: "0px 5px 5px rgba(0,0,0, 0.3)" }}
        className="flex-[0.7] bg-gray-100 px-1 rounded-lg"
      >
        {!selectedChat ? (
          <div className="w-full h-full flex gap-3 flex-col text-base items-center justify-center">
            Start Chatting!{" "}
            <span className="text-xs">Check Your Bargains!</span>
            <MessageSquareMore size={26} className="text-blue-700" />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col overflow-y-hidden text-base ">
            <div
              onClick={() => {
                const carIndex = allCars?.findIndex(
                  (car) => car._id == selectedChat.car_id._id
                );
                console.log({ carIndex });
                const car = allCars[carIndex];
                console.log({ car });
                dispatch(updateSelectedCar(car));
                navigate("/dealer/car-detail");
              }}
              className=" flex-[0.1] cursor-pointer flex p-1 gap-2 items-center bg-[#0e4e92] text-white rounded-md"
            >
              <div className="h-[3vmax]  w-[3vmax] rounded-full overflow-hidden bg-white border border-red-400">
                <img
                  src={selectedChat?.car_id?.image?.main?.url}
                  alt="car_img"
                  className="h-full w-full object-contain rounded-md"
                />
              </div>
              <span className="lg:text-base text-sm capitalize">
                {selectedChat?.chat_name_dealer} -{" "}
                {selectedChat?.chat_name_buyer}
              </span>
            </div>
            <div
              id="message-container"
              ref={messageContainerRef}
              className="flex-[0.9]  flex overflow-y-scroll flex-col bg-gray-200"
            >
              {/* //Messages */}
              <div className="sticky text-sm  flex justify-center py-1 divide-x-2 divide-gray-400 top-0 left-0 w-full bg-gray-100">
                <span
                  onClick={() => setChat("bargain")}
                  className={`px-5 cursor-pointer text-gray-400 ${
                    chat == "bargain" && "underline text-gray-600"
                  }`}
                >
                  Bargain
                </span>{" "}
                <span
                  onClick={() => setChat("chat")}
                  className={`px-5 cursor-pointer text-gray-400 ${
                    chat == "chat" && "underline text-gray-600"
                  }`}
                >
                  Chat
                </span>
              </div>
              {chat == "chat" ? (
                <div
                  id="car-container"
                  className="flex-1 flex flex-col gap-2  p-2"
                >
                  {selectedChat?.messages.map((message) => {
                    if (message.sender == user?._id) {
                      return (
                        <div
                          key={message._id}
                          className="bg-white text-sm ml-auto p-2 rounded-xl rounded-ee-none"
                        >
                          {message.message}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={message._id}
                        className="bg-blue-600 text-sm mr-auto text-white  p-2 rounded-xl rounded-es-none"
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
                  className="flex-1 flex flex-col gap-2  p-2"
                >
                  {selectedChat?.bargain?.map((bargain, index) => {
                    if (bargain.sender == user?._id) {
                      return (
                        <div
                          key={bargain._id || index}
                          className="bg-white text-sm flex flex-col gap-1 items-center  p-2 rounded-xl text-center"
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
                            } p-1 text-gray-600 text-xs rounded-md`}
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
                        className="bg-white text-sm flex flex-col gap-1 items-center  p-2 rounded-xl text-center"
                      >
                        <p>
                          Price Offered : ₹{" "}
                          {bargain.price.price?.toLocaleString("en-In")}
                        </p>

                        {bargain.price.status == "Ongoing" ? (
                          <div className="text-xs flex gap-2">
                            {" "}
                            <span
                              onClick={() => {
                                console.log(bargain._id);
                                getSocket().emit("price-accept", bargain._id);
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
                                getSocket().emit("price-reject", bargain._id);
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
                            } text-xs`}
                          >
                            You {bargain?.price?.status} the bargain
                          </p>
                        )}
                      </div>
                    );
                  })}
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
            ) : selectedChat?.last_bargain?.status == "Accepted" ? (
              <div className="p-2 text-center text-lg text-green-600">
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bargains;
