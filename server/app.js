require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.set("trust proxy", 1);
//file upload
const fileUpload = require("express-fileupload");
app.use(fileUpload());

//logger
const logger = require("morgan");
app.use(logger("tiny"));

// Middleware
app.post(
  "/api/v1/commerce/stripe/webhook",
  express.raw({ type: "application/json" }),
  require("./src/modules/commerce/commerce.controller").handleStripeWebhook
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

// Routes
app.use("/api/v1", require("./src/api"));

//ErrorHandling
const ErrorHandler = require("./Utils/ErrorHandler");
const { generatedError } = require("./Middleware/error");
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`Requested URL not found: ${req.url}`, 404));
});
app.use(generatedError);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
