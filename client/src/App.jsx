import HomePage from "./pages/HomePage";
import { Route, Routes, useNavigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import SignInDealer from "./pages/auth/SignInDealer";
import SignInBuyer from "./pages/auth/SignInBuyer";
import SignUpDealer from "./pages/auth/SignUpDealer";
import SignUpBuyer from "./pages/auth/SignUpBuyer";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useDispatch, useSelector } from "react-redux";
// import Dealer from "./pages/dealer/Dealer";
import { useEffect, useRef } from "react";
import Dealer from "./pages/dealer/Dealer";
import {
  notifyError,
  notifyErrorPromise,
  notifyPendingPromise,
  notifySuccessPromise,
} from "./utils/Toast";
import { asyncCurrentUser } from "./store/actions/appActions";
import { disconnect, getSocket, initializeConnection } from "./utils/Socket";
import Cars from "./pages/buyer/Cars";
import CarDetail from "./pages/buyer/CarDetails";
import ChatBuyer from "./components/ChatBuyer";
import {
  acceptPrice,
  addChat,
  receiveBargain,
  receiveMessage,
  rejectPrice,
  updateSelectedChat,
  updateUnreadChat,
  updateWatchList,
} from "./store/reducers/appReducer";
import WatchList from "./pages/buyer/WatchList";
import IsAuthenticated from "./middleware/IsAuthenticated";
import { asyncGetAllCars } from "./store/actions/carActions";
import MyCars from "./pages/buyer/MyCars";
import { useLocation } from "react-router-dom";
// import CarDetailDealer from "./pages/dealer/CarDetailDealer";
// import Wishlist from "./pages/Wishlist";

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, userType, user, selectedChat } = useSelector(
    (state) => state.app
  );

  let socket = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      initializeConnection(user);
      socket.current = getSocket();
      socket.current.on("receive-message", (data) => {
        // console.log("receive-message", data.message);
        data.status == 200 && dispatch(receiveMessage(data.message));
      });
      socket.current.on("receive-price", (data) => {
        // console.log("receive-price", data.bargain);
        data.status == 200 && dispatch(receiveBargain(data.bargain));
      });
      socket.current.on("price-reject", (data) => {
        // console.log("price-reject", data);
        data.status == 200 && dispatch(rejectPrice(data.bargain));
      });
      socket.current.on("price-accept", (data) => {
        // console.log("price-accept", data);
        data.status == 200 && dispatch(acceptPrice(data.bargain));
      });
      //for dealer
      socket.current.on("chat-created", (res) => {
        console.log(res);
        if (res.status == 200 || res.status == 201) {
          dispatch(addChat(res.chat));
          dispatch(updateSelectedChat(res.chat));
        } else {
          console.log(res);
          notifyError(res.message);
        }
      });
    } else {
      disconnect();
      navigate("/");
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    dispatch(asyncGetAllCars()).then((res) => {
      if (res != 200) notifyError("Cannot get the cars!");
    });
  }, []);

  useEffect(() => {
    if (user) {
      dispatch(updateWatchList(user?.watch_list));
      user?.chat.map((chat) => {
        // console.log({ chat: chat.unread, id: chat._id });
        if (chat.unread) dispatch(updateUnreadChat(chat._id));
      });
    }
  }, [user]);

  useEffect(() => {
    selectedChat && socket.current?.emit("unread-message", selectedChat._id);
  }, [selectedChat]);

  useEffect(() => {
    let id;
    if (
      !isAuthenticated &&
      (localStorage.getItem("accessToken") ||
        localStorage.getItem("refreshToken"))
    ) {
      id = notifyPendingPromise("Fetching Current User...");
      dispatch(asyncCurrentUser()).then((res) => {
        if (res.status == 200) {
          notifySuccessPromise(id, `${res.userType} fetched successfully!`);
        } else {
          console.log(res.message);
          notifyErrorPromise(id, res.message);
        }
      });
    }
  }, [userType]);

  useEffect(() => {
    if (userType == "Dealer") {
      console.log(userType);
      navigate("/dealer");
    }
  }, [userType]);

  const { pathname } = useLocation();

  // Automatically scrolls to top whenever pathname changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      {/* <ScrollToTop /> */}
      <div>
        {userType == "Dealer" ? "" : <Navbar />}
        <Routes>
          <Route path="/" index element={<HomePage />} />
          <Route path="/login-dealer" element={<SignInDealer />} />
          <Route path="/register-dealer" element={<SignUpDealer />} />
          <Route path="/sign-in" element={<SignInBuyer />} />
          <Route path="/sign-up" element={<SignUpBuyer />} />
          <Route path="/cars" element={<Cars />} />
          <Route
            path="/dealer/*"
            element={
              <IsAuthenticated>
                <Dealer />
              </IsAuthenticated>
            }
          />
          <Route path="/buyer" element={<HomePage />} />
          <Route
            path="/buyer/watch-list"
            element={
              <IsAuthenticated>
                <WatchList />
              </IsAuthenticated>
            }
          />
          <Route
            path="/buyer/my-cars"
            element={
              <IsAuthenticated>
                <MyCars />
              </IsAuthenticated>
            }
          />
          <Route path="/car-detail" element={<CarDetail />} />
          {/* <Route path="/dealer/car-detail" element={<CarDetailDealer />} /> */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        {userType == "Buyer" && <ChatBuyer />}
      </div>
    </>
  );
};

export default App;
