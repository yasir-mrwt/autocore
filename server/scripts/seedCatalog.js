require("dotenv").config();
const { getPrisma, disconnectPrisma } = require("../src/config/prisma");
const slugify = require("../src/utils/slug");

const imageUrl = "/assets/image/spare_part.png";

const categories = [
  "Engine Parts",
  "Brake System",
  "Suspension",
  "Electrical",
  "Filters",
  "Body Parts",
  "Transmission",
  "Cooling System",
];

const vehicleData = [
  {
    brand: "Toyota",
    models: [
      { name: "Corolla", engines: [["2014", "2024", "Petrol", "1ZR-FE", "Petrol", "1.6L"]] },
      { name: "Yaris", engines: [["2020", "2024", "Petrol", "2NR-FE", "Petrol", "1.3L"]] },
    ],
  },
  {
    brand: "Honda",
    models: [
      { name: "Civic", engines: [["2016", "2024", "Petrol", "R18", "Petrol", "1.8L"]] },
      { name: "City", engines: [["2015", "2024", "Petrol", "L15", "Petrol", "1.5L"]] },
    ],
  },
  {
    brand: "Suzuki",
    models: [
      { name: "Cultus", engines: [["2017", "2024", "Petrol", "K10B", "Petrol", "1.0L"]] },
      { name: "Swift", engines: [["2012", "2024", "Petrol", "K12M", "Petrol", "1.2L"]] },
    ],
  },
  {
    brand: "Kia",
    models: [
      { name: "Sportage", engines: [["2019", "2024", "Petrol", "NU", "Petrol", "2.0L"]] },
    ],
  },
  {
    brand: "Hyundai",
    models: [
      { name: "Tucson", engines: [["2020", "2024", "Petrol", "NU", "Petrol", "2.0L"]] },
    ],
  },
];

const products = [
  ["Premium Brake Disc Rotor", "Brake System", "Toyota", "Corolla", 8500, 12000, "BDR-TOY-001", 5, 128, 30],
  ["Performance Air Filter", "Engine Parts", "Honda", "Civic", 3200, 5000, "AF-HON-002", 4, 95, 42],
  ["LED Headlight Assembly", "Electrical", "Suzuki", "Swift", 11500, 18000, "LED-SUZ-003", 5, 203, 18],
  ["Ceramic Brake Pads Set", "Brake System", "Kia", "Sportage", 5500, 8000, "BP-KIA-004", 4, 167, 0],
  ["Shock Absorber Kit", "Suspension", "Toyota", "Yaris", 14500, 22000, "SA-TOY-005", 5, 84, 12],
  ["Radiator Coolant Hose", "Cooling System", "Honda", "City", 2200, 3500, "RCH-HON-006", 4, 56, 35],
  ["Engine Oil Filter Premium", "Filters", "Suzuki", "Cultus", 1400, null, "EOF-SUZ-007", 4, 310, 70],
  ["Timing Belt Kit", "Engine Parts", "Toyota", "Corolla", 9800, 14000, "TBK-TOY-008", 5, 142, 19],
  ["Power Steering Pump", "Suspension", "Honda", "Civic", 18500, null, "PSP-HON-009", 4, 67, 8],
  ["AC Compressor", "Cooling System", "Hyundai", "Tucson", 32000, 45000, "ACC-HYU-010", 5, 89, 6],
  ["Alternator 12V", "Electrical", "Kia", "Sportage", 15500, null, "ALT-KIA-011", 4, 45, 0],
  ["Fuel Pump Assembly", "Engine Parts", "Suzuki", "Swift", 7800, 11000, "FPA-SUZ-012", 5, 203, 21],
  ["Spark Plug Set (4pcs)", "Engine Parts", "Toyota", "Yaris", 2800, null, "SP-TOY-013", 4, 520, 80],
  ["Wheel Bearing Kit", "Suspension", "Honda", "City", 4200, 6000, "WBK-HON-014", 4, 98, 24],
  ["Cabin Air Filter", "Filters", "Hyundai", "Tucson", 1800, null, "CAF-HYU-015", 5, 187, 65],
  ["Door Mirror Assembly (Left)", "Body Parts", "Kia", "Sportage", 8900, 12500, "DMA-KIA-016", 4, 34, 9],
  ["Clutch Kit Complete", "Transmission", "Suzuki", "Cultus", 22000, 30000, "CK-SUZ-017", 5, 76, 13],
  ["Radiator Fan Motor", "Cooling System", "Toyota", "Corolla", 6500, null, "RFM-TOY-018", 4, 112, 0],
  ["Windshield Wiper Blades", "Body Parts", "Honda", "City", 1200, null, "WWB-HON-019", 4, 430, 90],
  ["Gearbox Oil Seal Set", "Transmission", "Hyundai", "Tucson", 3500, 5000, "GOSS-HYU-020", 5, 58, 40],
  ["Battery 65Ah MF", "Electrical", "Toyota", "Corolla", 18000, null, "BAT-TOY-021", 5, 621, 22],
  ["Oil Drain Plug Set", "Filters", "Kia", "Sportage", 450, null, "ODP-KIA-022", 4, 89, 120],
  ["Front Bumper Cover", "Body Parts", "Suzuki", "Swift", 15000, 22000, "FBC-SUZ-023", 4, 27, 5],
  ["CV Joint Boot Kit", "Suspension", "Honda", "Civic", 3200, null, "CVJB-HON-024", 5, 143, 34],
];

const toDecimalString = (value) => (value === null || value === undefined ? null : Number(value).toFixed(2));

const main = async () => {
  const prisma = getPrisma();
  const categoryByName = new Map();
  const brandByName = new Map();
  const modelByKey = new Map();
  const engineByKey = new Map();

  for (const name of categories) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) },
    });
    categoryByName.set(name, category);
  }

  for (const entry of vehicleData) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(entry.brand) },
      update: { name: entry.brand },
      create: { name: entry.brand, slug: slugify(entry.brand) },
    });
    brandByName.set(entry.brand, brand);

    for (const modelEntry of entry.models) {
      const model = await prisma.vehicleModel.upsert({
        where: {
          brandId_slug: {
            brandId: brand.id,
            slug: slugify(modelEntry.name),
          },
        },
        update: { name: modelEntry.name },
        create: {
          brandId: brand.id,
          name: modelEntry.name,
          slug: slugify(modelEntry.name),
        },
      });
      modelByKey.set(`${entry.brand}:${modelEntry.name}`, model);

      for (const [yearFrom, yearTo, engineType, engineCode, fuelType, displacement] of modelEntry.engines) {
        const existingEngine = await prisma.vehicleEngine.findFirst({
          where: {
            modelId: model.id,
            yearFrom: Number(yearFrom),
            yearTo: Number(yearTo),
            engineType,
            engineCode,
          },
        });

        const engine =
          existingEngine ||
          (await prisma.vehicleEngine.create({
            data: {
              modelId: model.id,
              yearFrom: Number(yearFrom),
              yearTo: Number(yearTo),
              engineType,
              engineCode,
              fuelType,
              displacement,
            },
          }));

        engineByKey.set(`${entry.brand}:${modelEntry.name}`, engine);
      }
    }
  }

  for (const [name, categoryName, brandName, modelName, price, originalPrice, sku, rating, reviews, stock] of products) {
    const category = categoryByName.get(categoryName);
    const brand = brandByName.get(brandName);
    const model = modelByKey.get(`${brandName}:${modelName}`);
    const engine = engineByKey.get(`${brandName}:${modelName}`);
    const slug = slugify(name);

    const product = await prisma.product.upsert({
      where: { sku },
      update: {
        categoryId: category.id,
        name,
        slug,
        partNumber: sku,
        shortDescription: `${name} for reliable daily driving.`,
        description: `${name} selected for clean fitment, durable materials, and dependable performance.`,
        price: toDecimalString(price),
        originalPrice: toDecimalString(originalPrice),
        status: "ACTIVE",
        averageRating: toDecimalString(rating),
        reviewCount: reviews,
      },
      create: {
        categoryId: category.id,
        name,
        slug,
        sku,
        partNumber: sku,
        shortDescription: `${name} for reliable daily driving.`,
        description: `${name} selected for clean fitment, durable materials, and dependable performance.`,
        price: toDecimalString(price),
        originalPrice: toDecimalString(originalPrice),
        status: "ACTIVE",
        averageRating: toDecimalString(rating),
        reviewCount: reviews,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        imageUrl,
        altText: name,
        sortOrder: 0,
        isPrimary: true,
      },
    });

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {
        stockQuantity: stock,
        lowStockThreshold: 5,
        warehouseLocation: "Main Warehouse",
      },
      create: {
        productId: product.id,
        stockQuantity: stock,
        lowStockThreshold: 5,
        warehouseLocation: "Main Warehouse",
      },
    });

    await prisma.productCompatibility.deleteMany({ where: { productId: product.id } });
    await prisma.productCompatibility.create({
      data: {
        productId: product.id,
        brandId: brand.id,
        modelId: model.id,
        engineId: engine.id,
        yearFrom: engine.yearFrom,
        yearTo: engine.yearTo,
        engineType: engine.engineType,
      },
    });
  }

  console.log(`Seeded ${categories.length} categories, ${vehicleData.length} brands, and ${products.length} products.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
