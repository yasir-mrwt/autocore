exports.generatedError = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.error(err.message);
  } else {
    console.error(err.stack || err.message);
  }

  const payload = {
    message: err.message,
  };

  if (!isProduction) {
    payload.errName = err.name;
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};
