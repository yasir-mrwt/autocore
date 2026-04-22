const express = require("express");
const CatalogController = require("./catalog.controller");
const { requireAdmin, requireAuth } = require("../../middleware/auth");
const validateRequest = require("../../middleware/validateRequest");
const {
  createProductValidator,
  productPayloadValidator,
} = require("./catalog.validators");

const router = express.Router();

router.get(
  "/admin/products",
  requireAuth,
  requireAdmin,
  CatalogController.listAdminProducts
);
router.post(
  "/admin/products",
  requireAuth,
  requireAdmin,
  createProductValidator,
  validateRequest,
  CatalogController.createAdminProduct
);
router.get(
  "/admin/products/:idOrSlug",
  requireAuth,
  requireAdmin,
  CatalogController.getAdminProduct
);
router.patch(
  "/admin/products/:idOrSlug",
  requireAuth,
  requireAdmin,
  productPayloadValidator,
  validateRequest,
  CatalogController.updateAdminProduct
);
router.delete(
  "/admin/products/:idOrSlug",
  requireAuth,
  requireAdmin,
  CatalogController.archiveAdminProduct
);

router.get("/products", CatalogController.listProducts);
router.get("/products/:idOrSlug", CatalogController.getProduct);
router.get("/products/:idOrSlug/related", CatalogController.getRelatedProducts);
router.get("/categories", CatalogController.listCategories);
router.get("/brands", CatalogController.listBrands);
router.get("/brands/:brandIdOrSlug/models", CatalogController.listModels);
router.get("/models/:modelIdOrSlug/engines", CatalogController.listEngines);

module.exports = router;
