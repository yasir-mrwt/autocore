exports.generatedError = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  console.log(err.stack);

  console.log(err.code == "ETIMEOUT");

  res.status(statusCode).json({
    message: err.message,
    errName: err.name,
    stack: err.stack,
  });
};
