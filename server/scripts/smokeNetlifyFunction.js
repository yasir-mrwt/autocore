process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "test-access-token-secret";
process.env.STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY || "sk_test_netlify_smoke";
process.env.STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || "whsec_netlify_smoke";

const { handler } = require("../netlify/functions/api");
const { getStripeInstance } = require("../Utils/stripe");

const baseEvent = {
  headers: {
    host: "example.netlify.app",
  },
  multiValueHeaders: {},
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  body: "",
  isBase64Encoded: false,
  requestContext: {
    requestId: "netlify-smoke",
    identity: {},
  },
};

const invoke = (event) =>
  handler(
    {
      ...baseEvent,
      ...event,
      headers: {
        ...baseEvent.headers,
        ...(event.headers || {}),
      },
    },
    {}
  );

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const main = async () => {
  const health = await invoke({
    httpMethod: "GET",
    path: "/api/v1/health",
    body: null,
  });

  assert(health.statusCode === 200, "Expected /api/v1/health to return 200.");
  assert(
    JSON.parse(health.body).status === "ok",
    "Expected /api/v1/health body to contain status ok."
  );

  const directFunctionPath = await invoke({
    httpMethod: "GET",
    path: "/.netlify/functions/api/v1/health",
    body: null,
  });

  assert(
    directFunctionPath.statusCode === 200,
    "Expected direct Netlify function path to normalize to /api/v1/health."
  );

  const stripe = getStripeInstance();
  const webhookPayload = JSON.stringify({
    id: "evt_netlify_smoke",
    type: "customer.created",
    data: { object: { id: "cus_netlify_smoke" } },
  });
  const webhookSignature = stripe.webhooks.generateTestHeaderString({
    payload: webhookPayload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });

  const webhook = await invoke({
    httpMethod: "POST",
    path: "/api/v1/commerce/stripe/webhook",
    headers: {
      "content-type": "application/json",
      "stripe-signature": webhookSignature,
    },
    body: webhookPayload,
  });

  assert(
    webhook.statusCode === 200,
    "Expected valid Stripe test signature to verify through the webhook handler."
  );
  assert(
    JSON.parse(webhook.body).received === true,
    "Expected Stripe webhook handler to return received true."
  );

  console.log("Netlify function smoke tests passed.");
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
