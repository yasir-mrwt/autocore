const express = require("express");
const { requireAdmin, requireAuth } = require("../../middleware/auth");
const MediaController = require("./media.controller");

const router = express.Router();

router.post(
  "/admin/images",
  requireAuth,
  requireAdmin,
  MediaController.uploadAdminImage
);
router.delete(
  "/admin/images",
  requireAuth,
  requireAdmin,
  MediaController.deleteAdminImage
);

module.exports = router;
