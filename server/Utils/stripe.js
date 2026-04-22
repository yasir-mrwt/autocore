const Stripe = require("stripe");

let stripe;

const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

const getStripeInstance = () => {
  if (!isStripeConfigured()) return null;

  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripe;
};

module.exports = {
  getStripeInstance,
  isStripeConfigured,
};
