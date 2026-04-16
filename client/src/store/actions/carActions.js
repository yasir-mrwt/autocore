import axiosInstance from "../../utils/Axios";
import { catchAsyncError } from "../../utils/CatchErrors";
import { setAccessToken } from "../../utils/Token";
import {
  deleteMyCars,
  updateMyCars,
  updateAllCars,
  updateReview,
  addReview,
  deleteReview,
  updateWatchList,
  sellCar,
} from "../reducers/appReducer";

// -----------------------------Dealer----------------------------------------
//Get Dealer Cars
export const asyncGetDealerCars = catchAsyncError(
  (dealerId, page) => async (dispatch) => {
    const res = await axiosInstance.get(
      `/car/get-dealer-cars/${dealerId}?page=${page}`
    );
    if (res.data.newAccessToken) setAccessToken(res.data.newAccessToken);
    dispatch(updateMyCars(res.data.cars));
    return res.status;
  }
);

//Create Car
export const asyncCreateCar = catchAsyncError((car) => async () => {
  const res = await axiosInstance.post("/car/create", car, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  //console.log("create car---", res);
  if (res.status == 200) {
    if (res.newAccessToken) {
      setAccessToken(res.newAccessToken);
    }
  }
  return res.status;
});

//Update Car
export const asyncUpdateCar = catchAsyncError((carId, car) => async () => {
  const res = await axiosInstance.put(`/car/update/${carId}`, car, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  //console.log(res);

  if (res.newAccessToken) {
    setAccessToken(res.newAccessToken);
  }

  return res.status;
});

//Delete Car
export const asyncDeleteCar = catchAsyncError((carId) => async (dispatch) => {
  const res = await axiosInstance.delete(`/car/delete/${carId}`);

  if (res.newAccessToken) {
    setAccessToken(res.newAccessToken);
  }

  dispatch(deleteMyCars(res.data.deletedCar));

  return res.status;
});

// -----------------------------BUyer----------------------------------------
export const asyncGetAllCars = catchAsyncError(
  (queryParams) => async (dispatch) => {
    //console.log(queryParams);
    const params = new URLSearchParams(queryParams);
    const page = params.get("page");
    const type = params.get("type");
    const capacity = params.get("capacities");

    let queryString = "page=" + page;

    if (type) queryString += "&type=" + type;

    if (capacity) {
      let capacityValues = capacity.split(",");
      capacityValues = capacityValues.map((val) => {
        // return val.split(" ")[0].join(",");
        return val.split(" ")[0];
      });
      capacityValues = capacityValues.join(",");
      queryString += "&capacity=" + capacityValues;
    }

    const res = await axiosInstance.get(`/car/get?${queryString}`);
    //console.log(res);
    dispatch(updateAllCars(res.data.cars));

    return res.status;
  }
);

//Add Review
export const asyncAddReview = catchAsyncError((data) => async (dispatch) => {
  const res = await axiosInstance.post(`/review/add-review`, data);

  if (res.data.message.includes("updated")) {
    dispatch(updateReview(res.data.review));
  } else {
    dispatch(addReview(res.data.review));
  }

  //console.log(res.data);

  return { status: res.status, message: res.data.message };
});

//delete a review
export const asyncDeleteReview = catchAsyncError((data) => async (dispatch) => {
  const res = await axiosInstance.delete("/review/delete/" + data);
  //console.log(res);
  dispatch(deleteReview(res.data.review));
  return res.status;
});

//Add to Watchlist
export const asyncAddWatchList = catchAsyncError(
  (carId) => async (dispatch) => {
    const res = await axiosInstance.put("/buyer/watch-list/" + carId);
    console.log(res);

    dispatch(updateWatchList(res.data.watchList));
    if (res.data.newAccessToken) setAccessToken(res.data.newAccessToken);

    return res.status;
  }
);

//Delete to Watchlist
export const asyncDeleteWatchList = catchAsyncError(
  (carId) => async (dispatch) => {
    const res = await axiosInstance.delete("/buyer/watch-list/" + carId);
    console.log(res);
    dispatch(updateWatchList(res.data.watchList));

    if (res.data.newAccessToken) setAccessToken(res.data.newAccessToken);

    return res.status;
  }
);

//make-payment
export const asyncMakePayment = catchAsyncError((carId, userId) => async () => {
  console.log(carId);
  const res = await axiosInstance.post("/deal/make-payment", { carId, userId });
  return res;
});

//verify-payment
export const asyncVerifyPayment = catchAsyncError(
  (response, carId) => async (dispatch) => {
    const res = await axiosInstance.post("/deal/verify-payment", {
      response,
      carId,
    });

    console.log(res);
    if (res.status == 200) {
      const res = await axiosInstance.post("/deal/buy-car/" + carId, {
        response,
      });
      console.log(res);

      if (res.data.newAccessToken) {
        setAccessToken(res.data.newAccessToken);
      }

      dispatch(sellCar(carId));

      return res.status;
    }
  }
);
