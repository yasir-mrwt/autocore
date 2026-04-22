import { createSlice } from "@reduxjs/toolkit";

const initialRoleState = {
  isAuthenticated: false,
  user: null,
};

const initialState = {
  customer: { ...initialRoleState },
  admin: { ...initialRoleState },
  authChecked: false,
  isAuthenticated: false,
  userType: null,
  user: null,
};

const syncCustomerAlias = (state) => {
  state.isAuthenticated = state.customer.isAuthenticated;
  state.userType = state.customer.isAuthenticated ? "Buyer" : null;
  state.user = state.customer.user;
};

export const appReducer = createSlice({
  name: "app",
  initialState,
  reducers: {
    addUser: (state, action) => {
      const role = action.payload.userType === "Admin" ? "Admin" : "Buyer";
      if (role === "Admin") {
        state.admin.isAuthenticated = true;
        state.admin.user = action.payload.user;
      } else {
        state.customer.isAuthenticated = true;
        state.customer.user = action.payload.user;
        syncCustomerAlias(state);
      }
    },
    removeUser: (state, action) => {
      const role = action.payload?.userType === "Admin" ? "Admin" : "Buyer";
      if (role === "Admin") {
        state.admin.isAuthenticated = false;
        state.admin.user = null;
      } else {
        state.customer.isAuthenticated = false;
        state.customer.user = null;
        syncCustomerAlias(state);
      }
    },
    updateUser: (state, action) => {
      const role = action.payload?.userType === "Admin" ? "Admin" : "Buyer";
      if (role === "Admin") {
        state.admin.user = action.payload.user;
      } else {
        state.customer.user = action.payload.user || action.payload;
        syncCustomerAlias(state);
      }
    },
    markAuthChecked: (state) => {
      state.authChecked = true;
    },
  },
});

export const { addUser, removeUser, updateUser, markAuthChecked } = appReducer.actions;

export default appReducer.reducer;
