import { catchAsyncError } from "../../utils/CatchErrors";
import axiosInstance from "../../utils/Axios";
import { setAccessToken, setTokens } from "../../utils/Token";
import { addUser, removeUser } from "../reducers/appReducer";

// ----------------------------Current-User------------------------------
export const asyncCurrentUser = catchAsyncError(() => async (dispatch) => {
  const res = await axiosInstance.get("/current-user");
  console.log(res);
  if (res.status == 200) {
    if (res.data.newAccessToken) {
      setAccessToken(res.data.newAccessToken);
    }
    dispatch(addUser({ userType: res.data.userType, user: res.data.user }));
  }
  let userType = res.data.userType || null;
  return { userType, status: res.status };
});

// ------------------------AUTHENTICATION---------------------------------
// -----------------------------Dealer------------------------------------
export const asyncDealerSignUp = catchAsyncError(
  (dealer) => async (dispatch) => {
    const res = await axiosInstance.post("/dealer/register", dealer);
    setTokens(res.data.accessToken, res.data.refreshToken, res.data.userType);
    dispatch(addUser({ userType: "Dealer", user: res.data.newDealer }));
    return res.status;
  }
);

export const asyncDealerSignIn = catchAsyncError(
  (dealer) => async (dispatch) => {
    const res = await axiosInstance.post("/dealer/sign-in", dealer);

    setTokens(res.data.accessToken, res.data.refreshToken, res.data.userType);
    dispatch(addUser({ userType: "Dealer", user: res.data.dealer }));

    return res.status;
  }
);

// -----------------------------Buyer------------------------------------
export const asyncBuyerSignIn = catchAsyncError((buyer) => async (dispatch) => {
  const res = await axiosInstance.post("/buyer/sign-in", buyer);
  setTokens(res.data.accessToken, res.data.refreshToken, res.data.userType);
  dispatch(addUser({ userType: "Buyer", user: res.data.buyer }));
  return res.status;
});

export const asyncBuyerSignUp = catchAsyncError((buyer) => async (dispatch) => {
  const res = await axiosInstance.post("/buyer/register", buyer);
  setTokens(res.data.accessToken, res.data.refreshToken, res.data.userType);
  dispatch(addUser({ userType: "Buyer", user: res.data.newBuyer }));
  return res.status;
});

// ----------------------------Log-out------------------------------
export const asyncLogOut = () => (dispatch) => {
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userType");

    dispatch(removeUser());
    return 200;
  } catch (err) {
    console.log(err);
  }
};

// -----------------------------OTHER ASYNC FUNCTIONS------------------------------------

// -----------------------------Dealer----------------------------------------
