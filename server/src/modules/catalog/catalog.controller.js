const { getPrisma } = require("../../config/prisma");
const {
  formatBrand,
  formatCategory,
  formatProduct,
  formatVehicleEngine,
  formatVehicleModel,
} = require("./catalog.formatters");

const productInclude = {
  category: true,
  images: true,
  inventory: true,
  compatibilities: {
    include: {
      brand: true,
      model: { include: { brand: true } },
      engine: true,
    },
  },
};

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );

const textOrIdConditions = (value, textFields = ["slug", "name"]) => {
  const conditions = textFields.map((field) => ({
    [field]: { equals: value, mode: "insensitive" },
  }));

  if (isUuid(value)) {
    conditions.unshift({ id: value });
  }

  return conditions;
};

const productIdentityWhere = (value) => ({
  OR: [
    ...(isUuid(value) ? [{ id: value }] : []),
    { slug: value },
    { sku: value },
    { partNumber: value },
  ],
});

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const tokenizeSearchTerm = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 8);

const buildProductWhere = (query) => {
  const {
    keyword,
    search,
    category,
    make,
    brand,
    model,
    year,
    engineType,
    minPrice,
    maxPrice,
    inStock,
    onSale,
  } = query;
  const term = keyword || search;
  const where = {
    status: "ACTIVE",
  };

  if (term) {
    const tokens = tokenizeSearchTerm(term);
    where.AND = tokens.map((token) => ({
      OR: [
        { name: { contains: token, mode: "insensitive" } },
        { sku: { contains: token, mode: "insensitive" } },
        { partNumber: { contains: token, mode: "insensitive" } },
        { shortDescription: { contains: token, mode: "insensitive" } },
      ],
    }));
  }

  if (category) {
    where.category = {
      OR: textOrIdConditions(category),
    };
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  if (inStock === "true" || inStock === true) {
    where.inventory = {
      stockQuantity: { gt: 0 },
    };
  }

  if (onSale === "true" || onSale === true) {
    where.originalPrice = { not: null };
  }

  const selectedBrand = make || brand;
  const compatibilityAnd = [];

  if (selectedBrand) {
    compatibilityAnd.push({
      brand: {
        OR: textOrIdConditions(selectedBrand),
      },
    });
  }

  if (model) {
    compatibilityAnd.push({
      model: {
        OR: textOrIdConditions(model),
      },
    });
  }

  if (year) {
    const selectedYear = Number(year);
    compatibilityAnd.push({
      OR: [{ yearFrom: null }, { yearFrom: { lte: selectedYear } }],
    });
    compatibilityAnd.push({
      OR: [{ yearTo: null }, { yearTo: { gte: selectedYear } }],
    });
  }

  if (engineType) {
    compatibilityAnd.push({
      OR: [
        { engineType: { contains: engineType, mode: "insensitive" } },
        { engine: { engineType: { contains: engineType, mode: "insensitive" } } },
      ],
    });
  }

  if (compatibilityAnd.length) {
    where.compatibilities = {
      some: {
        AND: compatibilityAnd,
      },
    };
  }

  return where;
};

const getProductOrderBy = (sort) => {
  if (sort === "price_asc") return { price: "asc" };
  if (sort === "price_desc") return { price: "desc" };
  if (sort === "rating") return { averageRating: "desc" };
  if (sort === "newest") return { createdAt: "desc" };
  return { reviewCount: "desc" };
};

const getDiscountPercent = (product) => {
  const price = Number(product.price || 0);
  const originalPrice = Number(product.originalPrice || 0);
  if (!originalPrice || originalPrice <= price) return 0;
  return ((originalPrice - price) / originalPrice) * 100;
};

const listProductsWithComputedSort = async (prisma, { where, sort, skip, limit }) => {
  const products = await prisma.product.findMany({
    where,
    include: productInclude,
  });

  if (sort === "discount") {
    const sortedProducts = products.sort((a, b) => {
      const discountDiff = getDiscountPercent(b) - getDiscountPercent(a);
      if (discountDiff) return discountDiff;
      const ratingDiff = Number(b.averageRating || 0) - Number(a.averageRating || 0);
      if (ratingDiff) return ratingDiff;
      return Number(b.reviewCount || 0) - Number(a.reviewCount || 0);
    });

    return {
      total: sortedProducts.length,
      products: sortedProducts.slice(skip, skip + limit),
    };
  }

  if (sort === "sales") {
    const productIds = products.map((product) => product.id);
    if (!productIds.length) {
      return { total: 0, products: [] };
    }

    const salesRows = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        productId: { in: productIds },
        order: { paymentStatus: "SUCCEEDED" },
      },
      _sum: {
        quantity: true,
        lineTotal: true,
      },
    });

    const salesByProductId = new Map(
      salesRows
        .filter((row) => row.productId)
        .map((row) => [
          row.productId,
          {
            quantity: Number(row._sum.quantity || 0),
            revenue: Number(row._sum.lineTotal || 0),
          },
        ])
    );

    const sortedProducts = products
      .filter((product) => salesByProductId.has(product.id))
      .sort((a, b) => {
        const aSales = salesByProductId.get(a.id);
        const bSales = salesByProductId.get(b.id);
        const quantityDiff = bSales.quantity - aSales.quantity;
        if (quantityDiff) return quantityDiff;
        const revenueDiff = bSales.revenue - aSales.revenue;
        if (revenueDiff) return revenueDiff;
        return Number(b.reviewCount || 0) - Number(a.reviewCount || 0);
      });

    return {
      total: sortedProducts.length,
      products: sortedProducts.slice(skip, skip + limit),
    };
  }

  return { total: products.length, products: products.slice(skip, skip + limit) };
};

const slugify = (value) =>
  String(value || "product")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || "product";

const getUniqueSlug = async (prisma, baseSlug, ignoreId = null) => {
  const cleanBase = slugify(baseSlug);
  let candidate = cleanBase;
  let counter = 2;

  while (
    await prisma.product.findFirst({
      where: {
        slug: candidate,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
      },
      select: { id: true },
    })
  ) {
    candidate = `${cleanBase}-${counter}`;
    counter += 1;
  }

  return candidate;
};

const getOrCreateCategory = async (tx, { categoryId, category }) => {
  if (categoryId) {
    const existing = await tx.category.findUnique({ where: { id: categoryId } });
    if (existing) return existing.id;
  }

  const categoryName = String(category || "Auto Parts").trim() || "Auto Parts";
  const slug = slugify(categoryName);

  const existing = await tx.category.findFirst({
    where: {
      OR: [
        { slug },
        { name: { equals: categoryName, mode: "insensitive" } },
      ],
    },
  });

  if (existing) return existing.id;

  const created = await tx.category.create({
    data: {
      name: categoryName,
      slug,
    },
  });

  return created.id;
};

const cleanNullableString = (value) => {
  if (value === undefined) return undefined;
  const cleaned = String(value || "").trim();
  return cleaned || null;
};

const buildProductData = async (prisma, payload, existingProduct = null) => {
  const data = {};

  if (payload.name !== undefined) data.name = String(payload.name).trim();
  if (payload.sku !== undefined) data.sku = String(payload.sku).trim();
  if (payload.partNumber !== undefined) {
    data.partNumber = String(payload.partNumber).trim();
  }
  if (payload.shortDescription !== undefined) {
    data.shortDescription = cleanNullableString(payload.shortDescription);
  }
  if (payload.description !== undefined) {
    data.description = cleanNullableString(payload.description);
  }
  if (payload.price !== undefined) data.price = Number(payload.price);
  if (payload.originalPrice !== undefined) {
    data.originalPrice =
      payload.originalPrice === null || payload.originalPrice === ""
        ? null
        : Number(payload.originalPrice);
  }
  if (payload.status !== undefined) data.status = payload.status;

  if (payload.slug !== undefined || payload.name !== undefined) {
    data.slug = await getUniqueSlug(
      prisma,
      payload.slug || payload.name || existingProduct?.name,
      existingProduct?.id
    );
  }

  return data;
};

const replaceProductImages = async (tx, productId, payload) => {
  const hasImageUpdate = payload.image !== undefined || payload.images !== undefined;
  if (!hasImageUpdate) return;

  const imageList = [
    ...(payload.image ? [payload.image] : []),
    ...((payload.images || []).filter(Boolean)),
  ].filter((value, index, array) => array.indexOf(value) === index);

  await tx.productImage.deleteMany({ where: { productId } });
  if (!imageList.length) return;

  await tx.productImage.createMany({
    data: imageList.map((imageUrl, index) => ({
      productId,
      imageUrl,
      altText: payload.name || "AutoCore spare part",
      sortOrder: index,
      isPrimary: index === 0,
    })),
  });
};

const upsertInventory = (tx, productId, payload) => {
  const hasInventoryUpdate =
    payload.stock !== undefined ||
    payload.lowStockThreshold !== undefined ||
    payload.warehouseLocation !== undefined ||
    payload.inStock !== undefined;

  if (!hasInventoryUpdate) return null;

  const stockQuantity =
    payload.inStock === false && payload.stock === undefined
      ? 0
      : Math.max(Number(payload.stock ?? 0), 0);

  return tx.inventory.upsert({
    where: { productId },
    create: {
      productId,
      stockQuantity,
      lowStockThreshold: Number(payload.lowStockThreshold ?? 5),
      warehouseLocation: cleanNullableString(payload.warehouseLocation),
    },
    update: {
      ...(payload.stock !== undefined || payload.inStock !== undefined
        ? { stockQuantity }
        : {}),
      ...(payload.lowStockThreshold !== undefined
        ? { lowStockThreshold: Number(payload.lowStockThreshold) }
        : {}),
      ...(payload.warehouseLocation !== undefined
        ? { warehouseLocation: cleanNullableString(payload.warehouseLocation) }
        : {}),
    },
  });
};

const cleanCompatibilityId = (value) => {
  const cleaned = cleanNullableString(value);
  return cleaned || undefined;
};

const replaceProductCompatibilities = async (tx, productId, payload) => {
  if (!Array.isArray(payload.compatibilities)) return;

  const compatibilities = payload.compatibilities
    .map((item) => ({
      brandId: cleanCompatibilityId(item.brandId),
      modelId: cleanCompatibilityId(item.modelId),
      engineId: cleanCompatibilityId(item.engineId),
      yearFrom:
        item.yearFrom === "" || item.yearFrom === null || item.yearFrom === undefined
          ? null
          : Number(item.yearFrom),
      yearTo:
        item.yearTo === "" || item.yearTo === null || item.yearTo === undefined
          ? null
          : Number(item.yearTo),
      engineType: cleanNullableString(item.engineType),
      notes: cleanNullableString(item.notes),
    }))
    .filter((item) => item.brandId);

  await tx.productCompatibility.deleteMany({ where: { productId } });

  if (!compatibilities.length) return;

  await tx.productCompatibility.createMany({
    data: compatibilities.map((item) => ({
      productId,
      brandId: item.brandId,
      modelId: item.modelId || null,
      engineId: item.engineId || null,
      yearFrom: item.yearFrom,
      yearTo: item.yearTo,
      engineType: item.engineType,
      notes: item.notes,
    })),
  });
};

const createCatalogAuditLog = (tx, { adminId, action, productId, metadata }) =>
  tx.adminAuditLog.create({
    data: {
      adminId,
      action,
      entityType: "PRODUCT",
      entityId: productId,
      metadata,
    },
  });

const buildAdminProductWhere = (query) => {
  const where = {};
  const term = query.keyword || query.search;

  if (term) {
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { sku: { contains: term, mode: "insensitive" } },
      { partNumber: { contains: term, mode: "insensitive" } },
      { shortDescription: { contains: term, mode: "insensitive" } },
    ];
  }

  if (query.status && query.status !== "ALL") where.status = query.status;

  if (query.category) {
    where.category = {
      OR: textOrIdConditions(query.category),
    };
  }

  return where;
};

const listAdminProducts = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 24), 100);
    const skip = (page - 1) * limit;
    const where = buildAdminProductWhere(req.query);

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: productInclude,
      }),
    ]);

    return res.status(200).json({
      products: products.map(formatProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + products.length < total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminProduct = async (req, res, next) => {
  try {
    const product = await getPrisma().product.findFirst({
      where: productIdentityWhere(req.params.idOrSlug),
      include: productInclude,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json({ product: formatProduct(product) });
  } catch (error) {
    return next(error);
  }
};

const createAdminProduct = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const product = await prisma.$transaction(async (tx) => {
      const categoryId = await getOrCreateCategory(tx, req.body);
      const productData = await buildProductData(tx, {
        ...req.body,
        slug: req.body.slug || req.body.name,
      });

      const created = await tx.product.create({
        data: {
          ...productData,
          categoryId,
          status: req.body.status || "ACTIVE",
        },
      });

      await replaceProductImages(tx, created.id, req.body);
      await upsertInventory(tx, created.id, req.body);
      await replaceProductCompatibilities(tx, created.id, req.body);
      await createCatalogAuditLog(tx, {
        adminId: req.user.id,
        action: "PRODUCT_CREATED",
        productId: created.id,
        metadata: { sku: created.sku },
      });

      return tx.product.findUnique({
        where: { id: created.id },
        include: productInclude,
      });
    });

    return res.status(201).json({
      message: "Product created.",
      product: formatProduct(product),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "SKU, slug, or part number already exists." });
    }
    return next(error);
  }
};

const updateAdminProduct = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const existingProduct = await prisma.product.findFirst({
      where: productIdentityWhere(req.params.idOrSlug),
      include: productInclude,
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    const product = await prisma.$transaction(async (tx) => {
      const categoryId =
        req.body.categoryId !== undefined || req.body.category !== undefined
          ? await getOrCreateCategory(tx, req.body)
          : undefined;
      const productData = await buildProductData(tx, req.body, existingProduct);

      const updated = await tx.product.update({
        where: { id: existingProduct.id },
        data: {
          ...productData,
          ...(categoryId ? { categoryId } : {}),
        },
      });

      await replaceProductImages(tx, updated.id, req.body);
      await upsertInventory(tx, updated.id, req.body);
      await replaceProductCompatibilities(tx, updated.id, req.body);
      await createCatalogAuditLog(tx, {
        adminId: req.user.id,
        action: "PRODUCT_UPDATED",
        productId: updated.id,
        metadata: { sku: updated.sku, fields: Object.keys(req.body) },
      });

      return tx.product.findUnique({
        where: { id: updated.id },
        include: productInclude,
      });
    });

    return res.status(200).json({
      message: "Product updated.",
      product: formatProduct(product),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "SKU, slug, or part number already exists." });
    }
    return next(error);
  }
};

const archiveAdminProduct = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const existingProduct = await prisma.product.findFirst({
      where: productIdentityWhere(req.params.idOrSlug),
      select: { id: true, sku: true },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: existingProduct.id },
        data: { status: "ARCHIVED" },
        include: productInclude,
      });

      await createCatalogAuditLog(tx, {
        adminId: req.user.id,
        action: "PRODUCT_ARCHIVED",
        productId: updated.id,
        metadata: { sku: updated.sku },
      });

      return updated;
    });

    return res.status(200).json({
      message: "Product archived.",
      product: formatProduct(product),
    });
  } catch (error) {
    return next(error);
  }
};

const listProducts = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 12), 48);
    const skip = (page - 1) * limit;
    const where = buildProductWhere(req.query);
    const usesComputedSort = ["discount", "sales"].includes(req.query.sort);

    if (usesComputedSort) {
      const { total, products } = await listProductsWithComputedSort(prisma, {
        where,
        sort: req.query.sort,
        skip,
        limit,
      });

      return res.status(200).json({
        products: products.map(formatProduct),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + products.length < total,
        },
      });
    }

    const orderBy = getProductOrderBy(req.query.sort);

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: productInclude,
      }),
    ]);

    res.status(200).json({
      products: products.map(formatProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + products.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const prisma = getPrisma();
    const product = await prisma.product.findFirst({
      where: {
        status: "ACTIVE",
        ...productIdentityWhere(idOrSlug),
      },
      include: productInclude,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json({ product: formatProduct(product) });
  } catch (error) {
    return next(error);
  }
};

const getRelatedProducts = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const limit = Math.min(parsePositiveInt(req.query.limit, 8), 16);
    const prisma = getPrisma();
    const product = await prisma.product.findFirst({
      where: {
        status: "ACTIVE",
        ...productIdentityWhere(idOrSlug),
      },
      include: {
        compatibilities: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const brandIds = product.compatibilities.map((item) => item.brandId);
    const related = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        status: "ACTIVE",
        OR: [
          { categoryId: product.categoryId },
          ...(brandIds.length
            ? [{ compatibilities: { some: { brandId: { in: brandIds } } } }]
            : []),
        ],
      },
      orderBy: [{ averageRating: "desc" }, { reviewCount: "desc" }],
      take: limit,
      include: productInclude,
    });

    if (related.length < limit) {
      const fallback = await prisma.product.findMany({
        where: {
          id: { notIn: [product.id, ...related.map((item) => item.id)] },
          status: "ACTIVE",
        },
        orderBy: [{ reviewCount: "desc" }, { averageRating: "desc" }],
        take: limit - related.length,
        include: productInclude,
      });

      return res.status(200).json({
        products: [...related, ...fallback].map(formatProduct),
      });
    }

    return res.status(200).json({ products: related.map(formatProduct) });
  } catch (error) {
    return next(error);
  }
};

const listCategories = async (req, res, next) => {
  try {
    const categories = await getPrisma().category.findMany({
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    res.status(200).json({
      categories: categories.map((category) => ({
        ...formatCategory(category),
        productCount: category._count.products,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const listBrands = async (req, res, next) => {
  try {
    const brands = await getPrisma().brand.findMany({
      orderBy: { name: "asc" },
      include: {
        models: {
          orderBy: { name: "asc" },
        },
      },
    });

    res.status(200).json({
      brands: brands.map((brand) => ({
        ...formatBrand(brand),
        models: brand.models.map(formatVehicleModel),
      })),
    });
  } catch (error) {
    next(error);
  }
};

const listModels = async (req, res, next) => {
  try {
    const { brandIdOrSlug } = req.params;
    const models = await getPrisma().vehicleModel.findMany({
      where: {
        brand: {
          OR: textOrIdConditions(brandIdOrSlug),
        },
      },
      orderBy: { name: "asc" },
      include: { brand: true },
    });

    res.status(200).json({ models: models.map(formatVehicleModel) });
  } catch (error) {
    next(error);
  }
};

const listEngines = async (req, res, next) => {
  try {
    const { modelIdOrSlug } = req.params;
    const engines = await getPrisma().vehicleEngine.findMany({
      where: {
        model: {
          OR: textOrIdConditions(modelIdOrSlug),
        },
      },
      orderBy: [{ yearFrom: "desc" }, { engineType: "asc" }],
    });

    res.status(200).json({ engines: engines.map(formatVehicleEngine) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAdminProducts,
  getAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  archiveAdminProduct,
  listProducts,
  getProduct,
  getRelatedProducts,
  listCategories,
  listBrands,
  listModels,
  listEngines,
};
