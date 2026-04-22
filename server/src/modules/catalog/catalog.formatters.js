const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

const formatCategory = (category) =>
  category
    ? {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
      }
    : null;

const formatBrand = (brand) =>
  brand
    ? {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl,
      }
    : null;

const formatVehicleModel = (model) =>
  model
    ? {
        id: model.id,
        name: model.name,
        slug: model.slug,
        brandId: model.brandId,
        brand: formatBrand(model.brand),
      }
    : null;

const formatVehicleEngine = (engine) =>
  engine
    ? {
        id: engine.id,
        modelId: engine.modelId,
        yearFrom: engine.yearFrom,
        yearTo: engine.yearTo,
        engineType: engine.engineType,
        engineCode: engine.engineCode,
        fuelType: engine.fuelType,
        displacement: engine.displacement,
      }
    : null;

const formatInventory = (inventory) => {
  if (!inventory) {
    return {
      stockQuantity: 0,
      reservedQuantity: 0,
      availableStock: 0,
      inStock: false,
      lowStockThreshold: 0,
      warehouseLocation: null,
    };
  }

  const availableStock = Math.max(
    Number(inventory.stockQuantity || 0) - Number(inventory.reservedQuantity || 0),
    0
  );

  return {
    stockQuantity: inventory.stockQuantity,
    reservedQuantity: inventory.reservedQuantity,
    availableStock,
    inStock: availableStock > 0,
    lowStockThreshold: inventory.lowStockThreshold,
    warehouseLocation: inventory.warehouseLocation,
  };
};

const formatCompatibility = (compatibility) => ({
  id: compatibility.id,
  brand: formatBrand(compatibility.brand),
  model: formatVehicleModel(compatibility.model),
  engine: formatVehicleEngine(compatibility.engine),
  yearFrom: compatibility.yearFrom,
  yearTo: compatibility.yearTo,
  engineType: compatibility.engineType,
  notes: compatibility.notes,
});

const formatProduct = (product) => {
  const images = (product.images || [])
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    }));
  const primaryImage = images.find((image) => image.isPrimary) || images[0] || null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    partNumber: product.partNumber,
    shortDescription: product.shortDescription,
    description: product.description,
    price: toNumber(product.price),
    originalPrice: toNumber(product.originalPrice),
    status: product.status,
    averageRating: toNumber(product.averageRating),
    reviewCount: product.reviewCount,
    category: formatCategory(product.category),
    images,
    image: primaryImage?.imageUrl || null,
    inventory: formatInventory(product.inventory),
    compatibilities: (product.compatibilities || []).map(formatCompatibility),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

module.exports = {
  formatBrand,
  formatCategory,
  formatCompatibility,
  formatInventory,
  formatProduct,
  formatVehicleEngine,
  formatVehicleModel,
};
