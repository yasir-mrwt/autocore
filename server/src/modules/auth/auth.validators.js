const { body } = require("express-validator");

const passwordRule = body("password")
  .isString()
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters long.");

const registerValidator = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name is required."),
  body("email").trim().isEmail().normalizeEmail().withMessage("Valid email is required."),
  body("phone").optional({ nullable: true }).trim().isLength({ min: 7 }).withMessage("Phone is too short."),
  passwordRule,
];

const loginValidator = [
  body("email").trim().isEmail().normalizeEmail().withMessage("Valid email is required."),
  body("password").isString().notEmpty().withMessage("Password is required."),
];

const updateProfileValidator = [
  body("name").optional().trim().isLength({ min: 2, max: 120 }),
  body("phone").optional({ nullable: true }).trim().isLength({ min: 7, max: 30 }),
];

const changePasswordValidator = [
  body("currentPassword").isString().notEmpty().withMessage("Current password is required."),
  body("newPassword")
    .isString()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long."),
];

const requestPasswordResetValidator = [
  body("email").trim().isEmail().normalizeEmail().withMessage("Valid email is required."),
];

const confirmPasswordResetValidator = [
  body("email").trim().isEmail().normalizeEmail().withMessage("Valid email is required."),
  body("otp")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("A valid 6 digit OTP is required."),
  body("newPassword")
    .isString()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long."),
  body("confirmPassword")
    .isString()
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Confirm password must match new password."),
];

module.exports = {
  confirmPasswordResetValidator,
  registerValidator,
  loginValidator,
  requestPasswordResetValidator,
  updateProfileValidator,
  changePasswordValidator,
};
