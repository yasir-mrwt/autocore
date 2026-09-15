const serverless = require("serverless-http");
const app = require("../../app");

const expressHandler = serverless(app);

exports.handler = (event, context) => {
  const functionPath = "/.netlify/functions/api";
  if (event.path && event.path.startsWith(`${functionPath}/`)) {
    return expressHandler(
      {
        ...event,
        path: event.path.replace(functionPath, "/api"),
      },
      context
    );
  }

  return expressHandler(event, context);
};
