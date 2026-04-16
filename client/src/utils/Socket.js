import { io } from "socket.io-client";

var socket;
// https://car-dealership-backend.onrender.com/
export const initializeConnection = (user) => {
  socket = io("https://car-dealership-backend-production.up.railway.app/", {
    autoConnect: false,
  });
  socket.auth = { id: user._id, name: user.user_name };
  socket.connect();

  socket.onAny((event, ...args) => {
    console.log(event, args);
  });
};

export const sendMessage = (data) => {
  console.log({ data });
  socket.emit("send-message", data);
};

export const sendPrice = (data) => {
  console.log({ data });
  socket.emit("send-price", data);
};

export const sendMessageResponse = (callback) => {
  socket.on("send-message-response", (res) => {
    callback(res);
  });
};

export const disconnect = () => {
  socket?.disconnect();
};

export const getSocket = () => {
  return socket;
};
