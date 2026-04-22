const express = require("express");
const AuthController = require("./auth.controller");
const {
  changePasswordValidator,
  loginValidator,
  registerValidator,
  updateProfileValidator,
} = require("./auth.validators");
const validateRequest = require("../../middleware/validateRequest");
const { requireAuth } = require("../../middleware/auth");

const router = express.Router();

router.post("/register", registerValidator, validateRequest, AuthController.register);
router.post("/login", loginValidator, validateRequest, AuthController.login);
router.post("/admin/login", loginValidator, validateRequest, AuthController.adminLogin);
router.post("/refresh", AuthController.refresh);
router.post("/admin/refresh", AuthController.adminRefresh);
router.post("/logout", AuthController.logout);
router.post("/admin/logout", AuthController.adminLogout);
router.get("/me", requireAuth, AuthController.me);
router.patch(
  "/me",
  requireAuth,
  updateProfileValidator,
  validateRequest,
  AuthController.updateProfile
);
router.patch(
  "/me/password",
  requireAuth,
  changePasswordValidator,
  validateRequest,
  AuthController.changePassword
);

module.exports = router;
