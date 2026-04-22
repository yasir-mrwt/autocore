const { body } = require("express-validator");

const createReviewValidator = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5.")
    .toInt(),
  body("title")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("Review title must be 120 characters or less."),
  body("comment")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Review comment must be 1000 characters or less."),
];

module.exports = {
  createReviewValidator,
};
