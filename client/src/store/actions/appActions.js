import { catchAsyncError } from "../../utils/CatchErrors";
import { clearLegacyTokens, clearTokens, hasStoredSession, setTokens } from "../../utils/Token";
import { addUser, markAuthChecked, removeUser, updateUser } from "../reducers/appReducer";
import {
  adminLogin,
  changePassword,
  customerLogin,
  customerLogout,
  customerRegister,
  getMe,
  updateProfile,
} from "../../services/authService";
import { clearCart, setCartItems } from "../slices/cartSlice";
import { clearWishlist, setWishlistItems } from "../slices/wishlistSlice";
import { getCart, getWishlist } from "../../services/commerceService";

const hydrateCustomerCommerce = async (dispatch) => {
  try {
    const [cart, wishlist] = await Promise.all([getCart(), getWishlist()]);
    dispatch(setCartItems(cart.items));
    dispatch(setWishlistItems(wishlist.items));
  } catch (error) {
    dispatch(setCartItems([]));
    dispatch(setWishlistItems([]));
  }
};

const hydrateRole = async (dispatch, role) => {
  const res = await getMe(role);
  const expectedApiRole = role === "Admin" ? "ADMIN" : "CUSTOMER";
  if (res.user?.role !== expectedApiRole) {
    throw new Error(`${role} session role mismatch.`);
  }

  dispatch(addUser({ userType: role, user: res.user }));
  if (role === "Buyer") await hydrateCustomerCommerce(dispatch);
  return { userType: role, status: 200 };
};

export const asyncCurrentUser = catchAsyncError(() => async (dispatch) => {
  clearLegacyTokens();

  const results = [];

  if (hasStoredSession("Buyer")) {
    try {
      results.push(await hydrateRole(dispatch, "Buyer"));
    } catch (error) {
      clearTokens("Buyer");
      dispatch(removeUser({ userType: "Buyer" }));
      dispatch(clearCart());
      dispatch(clearWishlist());
    }
  }

  if (hasStoredSession("Admin")) {
    try {
      results.push(await hydrateRole(dispatch, "Admin"));
    } catch (error) {
      clearTokens("Admin");
      dispatch(removeUser({ userType: "Admin" }));
    }
  }

  dispatch(markAuthChecked());
  return results[0] || { userType: null, status: 401 };
});

export const asyncAdminSignIn = catchAsyncError(
  (credentials) => async (dispatch) => {
    const res = await adminLogin(credentials);
    setTokens(res.accessToken, res.refreshToken || "", "Admin");
    dispatch(addUser({ userType: "Admin", user: res.user }));
    return 200;
  }
);

export const asyncBuyerSignIn = catchAsyncError((buyer) => async (dispatch) => {
  const res = await customerLogin(buyer);
  setTokens(res.accessToken, res.refreshToken || "", "Buyer");
  dispatch(addUser({ userType: "Buyer", user: res.user }));
  await hydrateCustomerCommerce(dispatch);
  return 200;
});

export const asyncBuyerSignUp = catchAsyncError((buyer) => async (dispatch) => {
  const res = await customerRegister(buyer);
  setTokens(res.accessToken, res.refreshToken || "", "Buyer");
  dispatch(addUser({ userType: "Buyer", user: res.user }));
  await hydrateCustomerCommerce(dispatch);
  return 201;
});

export const asyncLogOut = (role = "Buyer") => (dispatch) => {
  try {
    customerLogout(role).catch(() => {});
    clearTokens(role);
    dispatch(removeUser({ userType: role }));

    if (role === "Buyer") {
      dispatch(clearCart());
      dispatch(clearWishlist());
    }

    return 200;
  } catch (err) {
    console.log(err);
  }
};

export const asyncUpdateProfile = catchAsyncError(
  (payload, role = "Buyer") => async (dispatch) => {
    const res = await updateProfile(payload, role);
    dispatch(updateUser({ userType: role, user: res.user }));
    return res;
  }
);

export const asyncChangePassword = catchAsyncError(
  (payload, role = "Buyer") => async (dispatch) => {
    const res = await changePassword(payload, role);
    clearTokens(role);
    dispatch(removeUser({ userType: role }));

    if (role === "Buyer") {
      dispatch(clearCart());
      dispatch(clearWishlist());
    }

    return res;
  }
);
