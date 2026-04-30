require("dotenv").config();

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { getPrisma, disconnectPrisma } = require("../src/config/prisma");
const slugify = require("../src/utils/slug");

const DEFAULT_SOURCE =
  "C:\\Users\\Laptop Valley\\Downloads\\auto_parts_seed_data.json";
const DEFAULT_PASSWORD = process.env.DEMO_IMPORT_PASSWORD || "Demo@12345";
const IMPORT_CONCURRENCY = Number(process.env.IMPORT_CONCURRENCY || 12);

const runConcurrent = async (items, worker, concurrency = IMPORT_CONCURRENCY) => {
  const results = new Array(items.length);
  let index = 0;

  const runners = Array.from(
    { length: Math.min(concurrency, Math.max(items.length, 1)) },
    async () => {
      while (index < items.length) {
        const currentIndex = index;
        index += 1;
        results[currentIndex] = await worker(items[currentIndex], currentIndex);
      }
    }
  );

  await Promise.all(runners);
  return results;
};

const toDate = (value) => (value ? new Date(value) : undefined);
const toDecimal = (value, fallback = 0) =>
  value === null || value === undefined || value === ""
    ? fallback
    : Number(value).toFixed(2);

const cleanString = (value, fallback = "") =>
  String(value || fallback).trim();

const mapOrderStatus = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "PENDING") return "PENDING_PAYMENT";
  if (value === "PAID") return "PAID";
  if (value === "PROCESSING") return "PROCESSING";
  if (value === "SHIPPED") return "SHIPPED";
  if (value === "DELIVERED") return "DELIVERED";
  if (value === "CANCELLED") return "CANCELLED";
  if (value === "REFUNDED") return "REFUNDED";
  return "PENDING_PAYMENT";
};

const mapPaymentStatus = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "PAID") return "SUCCEEDED";
  if (value === "SUCCEEDED") return "SUCCEEDED";
  if (value === "FAILED") return "FAILED";
  if (value === "CANCELLED") return "CANCELLED";
  if (value === "REFUNDED") return "REFUNDED";
  return "PENDING";
};

const loadJson = (sourcePath) => {
  const resolved = path.resolve(sourcePath);
  return JSON.parse(fs.readFileSync(resolved, "utf8"));
};

const upsertCategories = async (prisma, categories = []) => {
  const map = new Map();

  for (const item of categories) {
    const name = cleanString(item.name, "Auto Parts");
    const slug = cleanString(item.slug, slugify(name));
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    map.set(item.id, category);
    map.set(name, category);
  }

  return map;
};

const upsertVehicleData = async (prisma, vehicles = []) => {
  const vehicleMap = new Map();
  const brandMap = new Map();
  const modelMap = new Map();
  const engineMap = new Map();

  for (const vehicle of vehicles) {
    const make = cleanString(vehicle.make, "Universal");
    const modelName = cleanString(vehicle.model, "Universal");
    const brandSlug = slugify(make);

    const brand = await prisma.brand.upsert({
      where: { slug: brandSlug },
      update: { name: make },
      create: { name: make, slug: brandSlug },
    });
    brandMap.set(make, brand);

    const modelSlug = slugify(modelName);
    const model = await prisma.vehicleModel.upsert({
      where: {
        brandId_slug: {
          brandId: brand.id,
          slug: modelSlug,
        },
      },
      update: { name: modelName },
      create: {
        brandId: brand.id,
        name: modelName,
        slug: modelSlug,
      },
    });
    modelMap.set(`${make}:${modelName}`, model);

    const yearFrom = Number(vehicle.yearFrom || 1900);
    const yearTo = Number(vehicle.yearTo || yearFrom);
    const engineType = cleanString(vehicle.engineType, "Universal");
    const engineCode = cleanString(vehicle.engineCode, "");
    const existingEngine = await prisma.vehicleEngine.findFirst({
      where: {
        modelId: model.id,
        yearFrom,
        yearTo,
        engineType,
        engineCode: engineCode || null,
      },
    });
    const engine =
      existingEngine ||
      (await prisma.vehicleEngine.create({
        data: {
          modelId: model.id,
          yearFrom,
          yearTo,
          engineType,
          engineCode: engineCode || null,
          fuelType: vehicle.fuelType || null,
          displacement: vehicle.displacement || null,
        },
      }));

    engineMap.set(`${make}:${modelName}:${yearFrom}:${yearTo}:${engineType}:${engineCode}`, engine);
    vehicleMap.set(vehicle.id, {
      source: vehicle,
      brand,
      model,
      engine,
    });
  }

  return { brandMap, engineMap, modelMap, vehicleMap };
};

const upsertUsers = async (prisma, users = []) => {
  const map = new Map();
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const item of users) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        name: cleanString(item.name, "AutoCore User"),
        phone: item.phone || null,
        role: item.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
        status: item.status === "ACTIVE" ? "ACTIVE" : "BLOCKED",
      },
      create: {
        name: cleanString(item.name, "AutoCore User"),
        email: item.email,
        passwordHash,
        phone: item.phone || null,
        role: item.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
        status: item.status === "ACTIVE" ? "ACTIVE" : "BLOCKED",
        createdAt: toDate(item.createdAt) || new Date(),
      },
    });
    map.set(item.id, user);
    map.set(item.email, user);
  }

  return map;
};

const upsertProducts = async (prisma, data, categoryMap) => {
  const productMap = new Map();
  const imagesByProduct = new Map();
  const inventoryByProduct = new Map();
  const products = data.products || [];

  for (const image of data.productImages || []) {
    const list = imagesByProduct.get(image.productId) || [];
    list.push(image);
    imagesByProduct.set(image.productId, list);
  }

  for (const inventory of data.inventories || []) {
    inventoryByProduct.set(inventory.productId, inventory);
  }

  const importedProducts = await runConcurrent(products, async (item, index) => {
    const category =
      categoryMap.get(item.category) ||
      categoryMap.get((data.categories || []).find((cat) => cat.name === item.category)?.id);

    if (!category) {
      throw new Error(`Missing category for product ${item.sku}: ${item.category}`);
    }

    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        categoryId: category.id,
        name: item.name,
        slug: item.slug || slugify(item.name),
        partNumber: item.partNumber,
        shortDescription: item.shortDescription || null,
        description: item.description || null,
        price: toDecimal(item.price),
        originalPrice:
          item.originalPrice === null || item.originalPrice === undefined
            ? null
            : toDecimal(item.originalPrice),
        status: item.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
        averageRating: toDecimal(item.rating || 0),
        reviewCount: Number(item.reviewCount || 0),
      },
      create: {
        categoryId: category.id,
        name: item.name,
        slug: item.slug || slugify(item.name),
        sku: item.sku,
        partNumber: item.partNumber,
        shortDescription: item.shortDescription || null,
        description: item.description || null,
        price: toDecimal(item.price),
        originalPrice:
          item.originalPrice === null || item.originalPrice === undefined
            ? null
            : toDecimal(item.originalPrice),
        status: item.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
        averageRating: toDecimal(item.rating || 0),
        reviewCount: Number(item.reviewCount || 0),
        createdAt: toDate(item.createdAt) || new Date(),
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    const images = (imagesByProduct.get(item.id) || []).sort(
      (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)
    );

    if (images.length) {
      await prisma.productImage.createMany({
        data: images.map((image, index) => ({
          productId: product.id,
          imageUrl: image.url,
          altText: image.altText || item.name,
          sortOrder: Number(image.sortOrder || index),
          isPrimary: Boolean(image.isPrimary || index === 0),
        })),
      });
    }

    const inventory = inventoryByProduct.get(item.id);
    if (inventory) {
      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: {
          stockQuantity: Number(inventory.stockQuantity || 0),
          reservedQuantity: Number(inventory.reservedQuantity || 0),
          lowStockThreshold: Number(inventory.lowStockThreshold || 5),
          warehouseLocation: inventory.warehouseLocation || null,
        },
        create: {
          productId: product.id,
          stockQuantity: Number(inventory.stockQuantity || 0),
          reservedQuantity: Number(inventory.reservedQuantity || 0),
          lowStockThreshold: Number(inventory.lowStockThreshold || 5),
          warehouseLocation: inventory.warehouseLocation || null,
        },
      });
    }

    if ((index + 1) % 100 === 0 || index + 1 === products.length) {
      console.log(`Imported products ${index + 1}/${products.length}.`);
    }

    return { sourceId: item.id, sku: item.sku, product };
  });

  for (const item of importedProducts) {
    if (!item?.product) continue;
    productMap.set(item.sourceId, item.product);
    productMap.set(item.sku, item.product);
  }

  return productMap;
};

const upsertCompatibilities = async (prisma, compatibilities, productMap, vehicleMap) => {
  const grouped = new Map();

  for (const item of compatibilities || []) {
    const product = productMap.get(item.productId);
    const vehicle = vehicleMap.get(item.vehicleId);
    if (!product || !vehicle) continue;

    const list = grouped.get(product.id) || [];
    list.push({ item, vehicle });
    grouped.set(product.id, list);
  }

  const groupedEntries = [...grouped.entries()];
  await runConcurrent(groupedEntries, async ([productId, entries], index) => {
    await prisma.productCompatibility.deleteMany({ where: { productId } });
    await prisma.productCompatibility.createMany({
      data: entries.map(({ item, vehicle }) => ({
        productId,
        brandId: vehicle.brand.id,
        modelId: vehicle.model.id,
        engineId: vehicle.engine.id,
        yearFrom: Number(item.yearFrom || vehicle.source.yearFrom),
        yearTo: Number(item.yearTo || vehicle.source.yearTo),
        engineType: item.engineType || vehicle.source.engineType || null,
        notes: item.notes || null,
      })),
      skipDuplicates: true,
    });
    if ((index + 1) % 100 === 0 || index + 1 === groupedEntries.length) {
      console.log(`Imported compatibility groups ${index + 1}/${groupedEntries.length}.`);
    }
  });
};

const importOrders = async (prisma, data, userMap, productMap) => {
  const orderMap = new Map();
  const itemsByOrder = new Map();
  const paymentsByOrder = new Map();

  for (const item of data.orderItems || []) {
    const list = itemsByOrder.get(item.orderId) || [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  for (const payment of data.payments || []) {
    paymentsByOrder.set(payment.orderId, payment);
  }

  for (const item of data.orders || []) {
    const user =
      userMap.get(item.userId) ||
      userMap.get(item.customerEmail) ||
      (await prisma.user.findUnique({ where: { email: item.customerEmail } }));
    if (!user) continue;

    const orderItems = (itemsByOrder.get(item.id) || [])
      .map((orderItem) => ({
        source: orderItem,
        product: productMap.get(orderItem.productId),
      }))
      .filter((entry) => entry.product);

    if (!orderItems.length) continue;

    await prisma.order.deleteMany({ where: { orderNumber: item.orderNumber } });
    const paymentStatus = mapPaymentStatus(item.paymentStatus);
    const status = mapOrderStatus(item.status);
    const createdAt = toDate(item.createdAt) || new Date();

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        orderNumber: item.orderNumber,
        status,
        paymentStatus,
        subtotal: toDecimal(item.subtotal),
        shippingFee: toDecimal(item.shippingFee || 0),
        tax: toDecimal(0),
        discount: toDecimal(0),
        total: toDecimal(item.total),
        currency: item.currency || "PKR",
        shippingAddressSnapshot: {
          fullName: item.customerName || user.name,
          phone: user.phone || "",
          ...(item.shippingAddress || {}),
        },
        estimatedDeliveryAt: toDate(item.estimatedDeliveryDate),
        shippedAt: toDate(item.shippedDate),
        deliveredAt: toDate(item.deliveredDate),
        courierName: item.courierName || null,
        trackingNumber: item.trackingNumber || null,
        trackingUrl: item.trackingUrl || null,
        deliveryConfirmedAt: status === "DELIVERED" ? toDate(item.deliveredDate) || createdAt : null,
        placedAt: paymentStatus === "SUCCEEDED" ? createdAt : null,
        createdAt,
        items: {
          create: orderItems.map(({ source, product }) => ({
            productId: product.id,
            productName: source.productName,
            sku: source.sku,
            partNumber: source.partNumber,
            price: toDecimal(source.priceAtPurchase),
            quantity: Number(source.quantity || 1),
            lineTotal: toDecimal(source.lineTotal),
          })),
        },
        timeline: {
          create: {
            status,
            label: `Imported ${status.replaceAll("_", " ").toLowerCase()} order`,
            message: "Imported from auto_parts_seed_data.json.",
            createdAt,
          },
        },
      },
    });

    const payment = paymentsByOrder.get(item.id);
    if (payment) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: payment.provider === "STRIPE" ? "STRIPE" : "MANUAL",
          providerOrderId: payment.stripeSessionId || null,
          providerPaymentId: payment.stripePaymentIntentId || null,
          status: mapPaymentStatus(payment.status),
          amount: toDecimal(payment.amount),
          currency: payment.currency || "PKR",
          rawResponse: payment.rawResponse || null,
          createdAt: createdAt,
        },
      });
    }

    orderMap.set(item.id, order);
  }

  return orderMap;
};

const importReviews = async (prisma, reviews, productMap, userMap) => {
  const customers = [...new Map([...userMap.values()].map((user) => [user.id, user])).values()].filter(
    (user) => user.role === "CUSTOMER"
  );
  if (!customers.length) return;

  let customerIndex = 0;
  const seen = new Set();
  const rows = [];

  for (const item of reviews || []) {
    const product = productMap.get(item.productId);
    if (!product) continue;

    let user = customers[customerIndex % customers.length];
    customerIndex += 1;

    let attempts = 0;
    while (seen.has(`${user.id}:${product.id}`) && attempts < customers.length) {
      user = customers[customerIndex % customers.length];
      customerIndex += 1;
      attempts += 1;
    }

    if (seen.has(`${user.id}:${product.id}`)) continue;
    seen.add(`${user.id}:${product.id}`);

    rows.push({
      userId: user.id,
      productId: product.id,
      rating: Number(item.rating || 5),
      title: item.title || null,
      comment: item.comment || null,
      status: item.status === "APPROVED" ? "APPROVED" : "PENDING",
      createdAt: toDate(item.createdAt) || new Date(),
    });
  }

  for (let index = 0; index < rows.length; index += 250) {
    const batch = rows.slice(index, index + 250);
    await prisma.review.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`Imported reviews ${Math.min(index + batch.length, rows.length)}/${rows.length}.`);
  }
};

const syncReviewUpdates = async (prisma, reviews, productMap, userMap) => {
  const customers = [...new Map([...userMap.values()].map((user) => [user.id, user])).values()].filter(
    (user) => user.role === "CUSTOMER"
  );
  if (!customers.length) return;

  let customerIndex = 0;
  const seen = new Set();
  const updates = [];

  for (const item of reviews || []) {
    const product = productMap.get(item.productId);
    if (!product) continue;

    let user = customers[customerIndex % customers.length];
    customerIndex += 1;

    let attempts = 0;
    while (seen.has(`${user.id}:${product.id}`) && attempts < customers.length) {
      user = customers[customerIndex % customers.length];
      customerIndex += 1;
      attempts += 1;
    }

    if (seen.has(`${user.id}:${product.id}`)) continue;
    seen.add(`${user.id}:${product.id}`);
    updates.push({ item, user, product });
  }

  await runConcurrent(
    updates,
    async ({ item, user, product }, index) => {
      await prisma.review.upsert({
        where: {
          userId_productId: {
            userId: user.id,
            productId: product.id,
          },
        },
        update: {
          rating: Number(item.rating || 5),
          title: item.title || null,
          comment: item.comment || null,
          status: item.status === "APPROVED" ? "APPROVED" : "PENDING",
        },
        create: {
          userId: user.id,
          productId: product.id,
          rating: Number(item.rating || 5),
          title: item.title || null,
          comment: item.comment || null,
          status: item.status === "APPROVED" ? "APPROVED" : "PENDING",
          createdAt: toDate(item.createdAt) || new Date(),
        },
      });
      if ((index + 1) % 250 === 0 || index + 1 === updates.length) {
        console.log(`Synced review updates ${index + 1}/${updates.length}.`);
      }
    },
    Math.max(4, Math.floor(IMPORT_CONCURRENCY / 2))
  );
};

const importAuditLogs = async (prisma, auditLogs, userMap) => {
  const existing = await prisma.adminAuditLog.count({
    where: {
      metadata: {
        path: ["source"],
        equals: "auto_parts_seed_data.json",
      },
    },
  });

  if (existing) return;

  for (const item of auditLogs || []) {
    const admin = userMap.get(item.adminId);
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin?.id || null,
        action: item.action || "IMPORTED",
        entityType: item.entityType || "SeedData",
        entityId: item.entityId || null,
        metadata: {
          ...(item.metadata || {}),
          source: "auto_parts_seed_data.json",
        },
        createdAt: toDate(item.createdAt) || new Date(),
      },
    });
  }
};

const main = async () => {
  const sourcePath = process.argv[2] || DEFAULT_SOURCE;
  const data = loadJson(sourcePath);
  const prisma = getPrisma();

  console.log(`Importing ${sourcePath}`);
  console.log(JSON.stringify(data.meta?.counts || {}, null, 2));

  const categoryMap = await upsertCategories(prisma, data.categories);
  console.log(`Imported ${categoryMap.size} category keys.`);

  const { vehicleMap } = await upsertVehicleData(prisma, data.vehicles);
  console.log(`Imported ${vehicleMap.size} vehicles.`);

  const userMap = await upsertUsers(prisma, data.users);
  console.log(`Imported ${data.users?.length || 0} users. Demo password: ${DEFAULT_PASSWORD}`);

  const productMap = await upsertProducts(prisma, data, categoryMap);
  console.log(`Imported ${data.products?.length || 0} products.`);

  await upsertCompatibilities(prisma, data.compatibilities, productMap, vehicleMap);
  console.log(`Imported product compatibility mappings.`);

  await importOrders(prisma, data, userMap, productMap);
  console.log(`Imported orders and payments.`);

  await importReviews(prisma, data.reviews, productMap, userMap);
  await syncReviewUpdates(prisma, data.reviews, productMap, userMap);
  console.log(`Imported reviews.`);

  await importAuditLogs(prisma, data.auditLogs, userMap);
  console.log(`Imported audit logs.`);

  const [products, categories, brands, orders] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.order.count(),
  ]);

  console.log(
    `Done. Database totals: ${products} products, ${categories} categories, ${brands} vehicle makes, ${orders} orders.`
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
