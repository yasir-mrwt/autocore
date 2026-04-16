import axiosInstance from "../../utils/Axios";
import { catchAsyncError } from "../../utils/CatchErrors";
import { setAccessToken } from "../../utils/Token";
import { updateMyDeals } from "../reducers/appReducer";

export const asyncGetDealerDeals = catchAsyncError(
  (dealerId) => async (dispatch) => {
    const res = await axiosInstance.get("/deal/get-dealer/" + dealerId);
    dispatch(updateMyDeals(res.data.deals));
    res.data.newAccessToken && setAccessToken(res.data.newAccessToken);
    console.log(res);
  }
);
