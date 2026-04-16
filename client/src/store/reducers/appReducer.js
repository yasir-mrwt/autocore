import { createSlice } from "@reduxjs/toolkit";
import { produce } from "immer";

const initialState = {
  isAuthenticated: false,
  userType: null,
  user: null,
  allCars: null,
  myCars: null,
  watchList: null,
  selectedCar: null,
  selectedChat: null,
  unreadChat: null,
  myDeals: null,
};

export const appReducer = createSlice({
  name: "app",
  initialState,
  reducers: {
    addUser: (state, action) => {
      state.isAuthenticated = true;
      state.userType = action.payload.userType;
      state.user = action.payload.user;
    },
    removeUser: (state) => {
      state.isAuthenticated = false;
      state.userType = null;
      state.user = null;
    },
    updateUser: (state, action) => {
      state.user = action.payload;
    },
    updateAllCars: (state, action) => {
      state.allCars = action.payload;
    },
    updateMyCars: (state, action) => {
      state.myCars = action.payload;
    },
    deleteMyCars: (state, action) => {
      const carIdToDelete = action.payload;
      // Filter out the car with the specified ID
      const updatedCars = state.myCars.filter(
        (car) => car._id !== carIdToDelete
      );
      // Update the state with the filtered array
      state.myCars = updatedCars;
    },
    updateWatchList: (state, action) => {
      state.watchList = action.payload;
    },
    updateSelectedCar: (state, action) => {
      state.selectedCar = action.payload;
    },
    updateReview: (state, action) => {
      console.log(action.payload);
      const review = state.selectedCar.review.map((review) => {
        if (review._id == action.payload._id) {
          return (review = action.payload);
        }
        return review;
      });
      state.selectedCar.review = review;
      state.selectedCar.rating = action.payload.car_rating;
    },
    addReview: (state, action) => {
      console.log(action.payload);
      state.selectedCar.review.unshift(action.payload);
      state.selectedCar.rating = action.payload.car_rating;
    },
    deleteReview: (state, action) => {
      const index = state.selectedCar.review.findIndex(
        (review) => review._id == action.payload._id
      );
      if (index !== -1) {
        state.selectedCar.review.splice(index, 1);
      }
      state.selectedCar.rating = action.payload.car_rating || 0;
    },
    addMessage: (state, action) => {
      // console.log(action.payload);
      const index = state.user.chat.findIndex(
        (chat) => chat._id == action.payload.chat_id
      );
      console.log(index);
      if (index != -1) {
        state.user.chat[index].last_message = action.payload.message;
        state.user.chat[index].messages.push(action.payload);
        state.selectedChat.messages.push(action.payload);
      }
    },
    addPrice: (state, action) => {
      console.log(action.payload);
      const index = state.user.chat.findIndex(
        (chat) => chat._id == action.payload.chat_id
      );
      console.log(index);
      if (index != -1) {
        state.user.chat[index].bargain.push(action.payload);
        state.selectedChat.bargain.push(action.payload);
        state.user.chat[index].last_bargain = {
          price: action.payload.price.price,
          status: action.payload.price.status,
        };
      }
    },
    addChat: (state, action) => {
      const chatToAdd = action.payload;
      // Check if the chat already exists
      const chatExists = state.user.chat.some(
        (chat) => chat._id === chatToAdd._id
      );

      // If the chat doesn't exist, add it to the beginning of the chat list
      if (!chatExists) {
        state.user.chat.unshift(chatToAdd);
      }
    },

    updateSelectedChat: (state, action) => {
      state.selectedChat = action.payload;

      if (state.selectedChat) {
        const index = state.user.chat.findIndex(
          (chat) => chat._id == state.selectedChat._id
        );

        state.user.chat[index].unread = false;
      }

      if (state.unreadChat) {
        const index = state.unreadChat.indexOf(state.selectedChat?._id);
        if (index !== -1) {
          state.unreadChat.splice(index, 1);
        }
      }
    },
    updateUnreadChat: (state, action) => {
      !state.unreadChat
        ? (state.unreadChat = [action.payload])
        : !state.unreadChat.includes(action.payload) &&
          state.unreadChat.push(action.payload.chat_id);
    },
    receiveMessage: (state, action) => {
      if (state.selectedChat?._id == action.payload.chat_id)
        if (!state.selectedChat.messages.length) {
          state.selectedChat.messages = [action.payload];
        } else {
          const newMessage = action.payload;
          return {
            ...state,
            selectedChat: {
              ...state.selectedChat,
              messages: [...state.selectedChat.messages, newMessage],
            },
          };
        }
      //  state.selectedChat.messages.push(action.payload);
      else {
        if (!state.unreadChat) {
          state.unreadChat = [];
        }
        if (!state.unreadChat.includes(action.payload.chat_id)) {
          state.unreadChat.push(action.payload.chat_id);
        }
      }

      const index = state.user.chat.findIndex(
        (chat) => chat._id == action.payload.chat_id
      );
      // console.log(index);
      if (index != -1) {
        state.user.chat[index].last_message = action.payload.message;
        state.user.chat[index].messages.push(action.payload);
        const chat = state.user.chat[index];
        state.user.chat.splice(index, 1);
        state.user.chat.unshift(chat);
      }
    },
    receiveBargain: (state, action) => {
      if (state.selectedChat?._id == action.payload.chat_id) {
        if (!state.selectedChat.bargain.length) {
          state.selectedChat.bargain = [action.payload];
        } else state.selectedChat.bargain.push(action.payload);
      } else {
        if (!state.unreadChat) {
          state.unreadChat = [];
        }
        if (!state.unreadChat.includes(action.payload.chat_id)) {
          state.unreadChat.push(action.payload.chat_id);
        }
      }

      const index = state.user.chat.findIndex(
        (chat) => chat._id == action.payload.chat_id
      );
      console.log(index);
      if (index != -1) {
        state.user.chat[index].last_bargain = action.payload.message;
        state.user.chat[index].bargain.push(action.payload);
        const chat = state.user.chat[index];
        state.user.chat.splice(index, 1);
        state.user.chat.unshift(chat);
      }
    },
    sellCar: (state, action) => {
      const index = state.allCars.findIndex((car) => car._id == action.payload);
      if (index != -1) {
        state.allCars[index].sold = true;
        state.allCars[index].buyer_id = state.user._id;
      }
    },
    updateMyDeals: (state, action) => {
      state.myDeals = action.payload;
    },

    rejectPrice: (state, action) => {
      return produce(state, (draftState) => {
        const index = draftState.user.chat.findIndex(
          (chat) => chat._id === action.payload.chat_id
        );
        console.log({ index });
        if (index !== -1) {
          if (!draftState.user.chat[index].last_bargain) {
            draftState.user.chat[index].last_bargain = { status: "Rejected" };
            if (draftState.selectedChat)
              draftState.selectedChat.last_bargain = { status: "Rejected" };
          } else {
            draftState.user.chat[index].last_bargain.status = "Rejected";
            if (draftState.selectedChat) {
              console.log(draftState.selectedChat);
              if (draftState.selectedChat.last_bargain)
                draftState.selectedChat.last_bargain.status = "Rejected";
              else
                draftState.selectedChat.last_bargain = { status: "Rejected" };
            }
          }

          const bargainIndex = draftState.user.chat[index].bargain.findIndex(
            (bargain) => bargain._id === action.payload._id
          );

          if (bargainIndex !== -1) {
            draftState.user.chat[index].bargain[bargainIndex].price.status =
              "Rejected";
            if (draftState.selectedChat) {
              draftState.selectedChat.bargain[bargainIndex].price.status =
                "Rejected";
            }
          }
        }
      });
    },
    acceptPrice: (state, action) => {
      return produce(state, (draftState) => {
        const index = draftState.user.chat.findIndex(
          (chat) => chat._id === action.payload.chat_id
        );

        if (index !== -1) {
          if (draftState.user.chat[index].last_bargain)
            draftState.user.chat[index].last_bargain.status = "Accepted";
          else
            draftState.user.chat[index].last_bargain = { status: "Accepted" };
          if (draftState.selectedChat) {
            if (draftState.selectedChat.last_bargain)
              draftState.selectedChat.last_bargain.status = "Accepted";
            else draftState.selectedChat.last_bargain = { status: "Accepted" };
          }

          const bargainIndex = draftState.user.chat[index].bargain.findIndex(
            (bargain) => bargain._id === action.payload._id
          );

          if (bargainIndex !== -1) {
            draftState.user.chat[index].bargain[bargainIndex].price.status =
              "Accepted";
            if (draftState.selectedChat) {
              draftState.selectedChat.bargain[bargainIndex].price.status =
                "Accepted";
            }
          }
        }

        const carIndex = draftState.allCars.findIndex(
          (car) => car._id == action.payload.car_id
        );

        if (carIndex != -1) {
          draftState.allCars[index]?.bargained?.length != 0
            ? draftState.allCars[index].bargained.push({
                id: action.payload.buyer_id,
                price: action.payload.price.price,
              })
            : (draftState.allCars[index].bargained = [
                {
                  id: action.payload.buyer_id,
                  price: action.payload.price.price,
                },
              ]);

          draftState.selectedCar &&
            (draftState.selectedCar = draftState.allCars[index]);
        }
      });
    },
  },
});

export const {
  sellCar,
  addUser,
  removeUser,
  updateUser,
  updateAllCars,
  updateMyCars,
  updateWatchList,
  updateSelectedCar,
  deleteMyCars,
  updateReview,
  addReview,
  deleteReview,
  updateSelectedChat,
  addMessage,
  addPrice,
  addChat,
  receiveMessage,
  receiveBargain,
  updateUnreadChat,
  rejectPrice,
  acceptPrice,
  updateMyDeals,
} = appReducer.actions;

export default appReducer.reducer;
