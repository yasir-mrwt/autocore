require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.set("trust proxy", 1);

const getAllowedOrigins = () => {
  const configuredOrigins = process.env.CLIENT_ORIGIN || process.env.CLIENT_URL;
  if (!configuredOrigins) {
    return ["http://localhost:5173", "http://localhost:5174"];
  }

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};
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
    origin: getAllowedOrigins(),
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
let deliveryConfirmationInterval;

const startDeliveryConfirmationScheduler = () => {
  if (deliveryConfirmationInterval) return;

  const run = () => {
    require("./src/modules/commerce/commerce.controller")
      .sendDueDeliveryConfirmations()
      .catch((error) => {
        console.error("Delivery confirmation scheduler failed:", error.message);
      });
  };

  deliveryConfirmationInterval = setInterval(run, 10 * 60 * 1000);
  setTimeout(run, 30 * 1000);
};

const startServer = () =>
  app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
    startDeliveryConfirmationScheduler();
  });

if (require.main === module) {
  startServer();
}

module.exports = app;
