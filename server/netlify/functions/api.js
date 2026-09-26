const serverless = require("serverless-http");
const app = require("../../app");
const { flushInflowApm } = require("../../src/config/inflowApm");

const expressHandler = serverless(app);

exports.handler = async (event, context) => {
  const functionPath = "/.netlify/functions/api";
  let response;

  if (event.path && event.path.startsWith(`${functionPath}/`)) {
    response = await expressHandler(
      {
        ...event,
        path: event.path.replace(functionPath, "/api"),
      },
      context
    );
  } else {
    response = await expressHandler(event, context);
  }

  try {
    await new Promise((resolve) => setImmediate(resolve));
    await flushInflowApm();
  } catch (error) {
    console.warn("InflowAPM flush failed:", error.message);
  }

  return response;
};
