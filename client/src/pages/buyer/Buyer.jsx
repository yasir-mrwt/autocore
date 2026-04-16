// import socket from "../../utils/Socket";
import { useDispatch } from "react-redux";
import { asyncLogOut } from "../../store/actions/appActions";
import { useEffect } from "react";
import { getSocket } from "../../utils/Socket";

const Buyer = () => {
  const dispatch = useDispatch();

  const socket = getSocket();

  useEffect(() => {
    socket?.on("send", (data) => {
      console.log(data);
    });
  }, []);

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center">
      <button
        onClick={() => {
          socket?.emit("send", {
            id: "65e182d6e80679bb778a5568",
            msg: "checking...",
          });
        }}
      >
        Send
      </button>
      <button
        onClick={() => {
          dispatch(asyncLogOut());
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Buyer;
