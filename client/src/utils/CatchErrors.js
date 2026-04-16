export const catchError = (err) => {
  console.log(err);
  if (
    err.message == "Network Error" ||
    err.response.data.errName == "MongoServerSelectionError"
  ) {
    return { message: "Network Error" };
  }
  return {
    message: err.response.data.message,
    status: err.response.status,
  };
};

export const catchAsyncError = (func) => {
  return (...args) =>
    (dispatch) => {
      return func(...args)(dispatch).catch((err) => {
        return catchError(err);
      });
    };
};
