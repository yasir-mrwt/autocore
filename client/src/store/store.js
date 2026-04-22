import { configureStore } from "@reduxjs/toolkit";
import appReducer from "./reducers/appReducer";
import cartReducer from "./slices/cartSlice";
import wishlistReducer from "./slices/wishlistSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
  },
});
