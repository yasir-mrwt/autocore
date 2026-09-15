const {
  sendDueDeliveryConfirmations,
} = require("../../src/modules/commerce/commerce.controller");

exports.handler = async () => {
  try {
    const checkedOrders = await sendDueDeliveryConfirmations();

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: true,
        checkedOrders,
      }),
    };
  } catch (error) {
    console.error("Netlify delivery confirmation job failed:", error);

    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: false,
        message: error.message || "Delivery confirmation job failed.",
      }),
    };
  }
};
