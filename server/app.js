require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const {
  inflowApmMiddleware,
  shutdownInflowApm,
} = require("./src/config/inflowApm");
const { disconnectPrisma } = require("./src/config/prisma");

const app = express();
app.set("trust proxy", 1);

const defaultAllowedOrigins = [
  "https://autocorestore.netlify.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

const normalizeOrigin = (origin) => {
  const trimmedOrigin = String(origin || "").trim();
  if (!trimmedOrigin) return "";

  try {
    return new URL(trimmedOrigin).origin;
  } catch {
    return trimmedOrigin.replace(/\/+$/, "");
  }
};

const getAllowedOrigins = () => {
  const configuredOrigins = [process.env.CLIENT_ORIGIN, process.env.CLIENT_URL]
    .filter(Boolean)
    .join(",");

  return [...configuredOrigins.split(","), ...defaultAllowedOrigins]
    .map(normalizeOrigin)
    .filter(Boolean);
};

const allowedOrigins = new Set(getAllowedOrigins());
const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, allowedOrigins.has(normalizeOrigin(origin)));
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Refresh-Token", "User-Type"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

//file upload
const fileUpload = require("express-fileupload");
app.use(fileUpload());

//logger
const logger = require("morgan");
app.use(logger("tiny"));

// Middleware
app.post(
  "/api/v1/commerce/stripe/webhook",
  inflowApmMiddleware(),
  express.raw({ type: "application/json" }),
  require("./src/modules/commerce/commerce.controller").handleStripeWebhook
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/v1", require("./src/api"));

//ErrorHandling
const ErrorHandler = require("./Utils/ErrorHandler");
const { generatedError } = require("./Middleware/error");
app.use(inflowApmMiddleware());
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`Requested URL not found: ${req.url}`, 404));
});
app.use(generatedError);

const PORT = process.env.PORT || 8000;
let deliveryConfirmationInterval;
let server;

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

const stopServer = async () => {
  if (deliveryConfirmationInterval) {
    clearInterval(deliveryConfirmationInterval);
    deliveryConfirmationInterval = undefined;
  }

  await shutdownInflowApm();
  await disconnectPrisma();

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = undefined;
  }
};

const startServer = () => {
  server = app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
    startDeliveryConfirmationScheduler();
  });

  return server;
};

if (require.main === module) {
  startServer();

  const shutdown = async () => {
    try {
      await stopServer();
      process.exit(0);
    } catch (error) {
      console.error("Server shutdown failed:", error.message);
      process.exit(1);
    }
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

module.exports = app;
