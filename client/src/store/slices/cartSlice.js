import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

const findItemIndex = (items, id) => items.findIndex((item) => item.id === id);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartItems: (state, action) => {
      state.items = action.payload || [];
    },
    addToCart: (state, action) => {
      const product = action.payload;
      const qtyToAdd = Number(product.qty || product.quantity || 1);
      const existingIndex = findItemIndex(state.items, product.id);

      if (existingIndex >= 0) {
        state.items[existingIndex].qty += qtyToAdd;
      } else {
        state.items.push({
          ...product,
          qty: qtyToAdd,
          synced: product.synced || false,
        });
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    incrementCartItem: (state, action) => {
      const existingIndex = findItemIndex(state.items, action.payload);
      if (existingIndex >= 0) {
        state.items[existingIndex].qty += 1;
      }
    },
    decrementCartItem: (state, action) => {
      const existingIndex = findItemIndex(state.items, action.payload);
      if (existingIndex < 0) return;

      if (state.items[existingIndex].qty <= 1) {
        state.items.splice(existingIndex, 1);
      } else {
        state.items[existingIndex].qty -= 1;
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const {
  setCartItems,
  addToCart,
  removeFromCart,
  incrementCartItem,
  decrementCartItem,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
