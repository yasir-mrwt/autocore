const { body } = require("express-validator");

const productPayloadValidator = [
  body("name").optional().trim().isLength({ min: 2, max: 160 }),
  body("slug").optional({ nullable: true }).trim().isLength({ max: 180 }),
  body("sku").optional().trim().isLength({ min: 2, max: 80 }),
  body("partNumber").optional().trim().isLength({ min: 2, max: 80 }),
  body("shortDescription").optional({ nullable: true }).trim().isLength({ max: 240 }),
  body("description").optional({ nullable: true }).trim().isLength({ max: 3000 }),
  body("categoryId").optional({ nullable: true }).isUUID(),
  body("category").optional({ nullable: true }).trim().isLength({ min: 2, max: 120 }),
  body("price").optional().isFloat({ min: 0 }),
  body("originalPrice").optional({ nullable: true }).custom((value) => {
    if (value === "" || value === null || value === undefined) return true;
    return Number(value) >= 0;
  }),
  body("status").optional().isIn(["DRAFT", "ACTIVE", "ARCHIVED"]),
  body("stock").optional().isInt({ min: 0, max: 999999 }),
  body("lowStockThreshold").optional().isInt({ min: 0, max: 999999 }),
  body("warehouseLocation").optional({ nullable: true }).trim().isLength({ max: 120 }),
  body("image").optional({ nullable: true }).trim().isLength({ max: 1000 }),
  body("images").optional().isArray({ max: 12 }),
  body("images.*").optional().isString().isLength({ max: 1000 }),
  body("compatibilities").optional().isArray({ max: 30 }),
  body("compatibilities.*.brandId").optional().isUUID(),
  body("compatibilities.*.modelId").optional({ nullable: true }).custom((value) => {
    if (value === "" || value === null || value === undefined) return true;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(value)
    );
  }),
  body("compatibilities.*.engineId").optional({ nullable: true }).custom((value) => {
    if (value === "" || value === null || value === undefined) return true;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(value)
    );
  }),
  body("compatibilities.*.yearFrom").optional({ nullable: true }).custom((value) => {
    if (value === "" || value === null || value === undefined) return true;
    return Number.isInteger(Number(value)) && Number(value) >= 1900 && Number(value) <= 2100;
  }),
  body("compatibilities.*.yearTo").optional({ nullable: true }).custom((value) => {
    if (value === "" || value === null || value === undefined) return true;
    return Number.isInteger(Number(value)) && Number(value) >= 1900 && Number(value) <= 2100;
  }),
  body("compatibilities.*.engineType")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 }),
  body("compatibilities.*.notes").optional({ nullable: true }).trim().isLength({ max: 240 }),
];

const createProductValidator = [
  body("name").trim().isLength({ min: 2, max: 160 }).withMessage("Product name is required."),
  body("sku").trim().isLength({ min: 2, max: 80 }).withMessage("SKU is required."),
  body("partNumber")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Part number is required."),
  body("price").isFloat({ min: 0 }).withMessage("Product price is required."),
  ...productPayloadValidator,
];

module.exports = {
  createProductValidator,
  productPayloadValidator,
};
