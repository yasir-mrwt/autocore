let inflow;
let middleware;
let loadIssueLogged = false;

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const getPackageVersion = () => {
  try {
    return require("../../package.json").version;
  } catch (error) {
    return "1.0.0";
  }
};

const isConfigured = () =>
  Boolean(process.env.INFLOWAPM_API_KEY && process.env.INFLOWAPM_ENDPOINT);

const loadInflowApmClass = () => {
  try {
    return require("@inflowapm/node").InflowAPM;
  } catch (error) {
    if (!loadIssueLogged) {
      console.warn("InflowAPM disabled: SDK package is not available.");
      loadIssueLogged = true;
    }
    return null;
  }
};

const getInflowApm = () => {
  if (inflow) return inflow;

  if (!isConfigured()) return null;

  try {
    const InflowAPM = loadInflowApmClass();
    if (!InflowAPM) return null;

    inflow = new InflowAPM({
      apiKey: process.env.INFLOWAPM_API_KEY,
      endpoint: process.env.INFLOWAPM_ENDPOINT,
      service: process.env.INFLOWAPM_SERVICE || "autocore-api",
      environment:
        process.env.INFLOWAPM_ENVIRONMENT ||
        process.env.NODE_ENV ||
        "development",
      serviceVersion: process.env.INFLOWAPM_SERVICE_VERSION || getPackageVersion(),
      enabled: parseBoolean(process.env.INFLOWAPM_ENABLED, true),
      debug: parseBoolean(process.env.INFLOWAPM_DEBUG, false),
    });
  } catch (error) {
    console.warn("InflowAPM disabled:", error.message);
    return null;
  }

  return inflow;
};

const inflowApmMiddleware = (options) => {
  if (middleware && !options?.routePrefix) return middleware;

  const client = getInflowApm();
  if (!client) {
    return (_req, _res, next) => next();
  }

  const createdMiddleware = client.express(options);
  if (!options?.routePrefix) middleware = createdMiddleware;
  return createdMiddleware;
};

const flushInflowApm = async () => {
  const client = getInflowApm();
  if (!client) return null;
  return client.flush();
};

const shutdownInflowApm = async () => {
  const client = getInflowApm();
  if (!client) return null;
  return client.shutdown();
};

module.exports = {
  flushInflowApm,
  getInflowApm,
  inflowApmMiddleware,
  shutdownInflowApm,
};
