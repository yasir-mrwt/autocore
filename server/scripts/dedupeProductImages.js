require("dotenv").config();

const { getPrisma, disconnectPrisma } = require("../src/config/prisma");

const DRY_RUN = String(process.env.DRY_RUN ?? "true").toLowerCase() !== "false";
const UPDATE_CONCURRENCY = Number(process.env.IMAGE_DEDUPE_CONCURRENCY || 4);
const MAX_RETRIES = Number(process.env.IMAGE_DEDUPE_MAX_RETRIES || 3);

const CATEGORY_IMAGE_POOLS = {
  "Brake System": [
    "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1200&auto=format&fit=crop",
  ],
  "Engine Parts": [
    "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1200&auto=format&fit=crop",
  ],
  Suspension: [
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200&auto=format&fit=crop",
  ],
  Electrical: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1200&auto=format&fit=crop",
  ],
  Filters: [
    "https://images.unsplash.com/photo-1606577924006-27d39b132ae2?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1200&auto=format&fit=crop",
  ],
  "Cooling System": [
    "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1200&auto=format&fit=crop",
  ],
  "Body Parts": [
    "https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
  ],
  "Interior & Exterior Accessories": [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200&auto=format&fit=crop",
  ],
  Transmission: [
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1200&auto=format&fit=crop",
  ],
};

const CATEGORY_LOOKUP = Object.fromEntries(
  Object.keys(CATEGORY_IMAGE_POOLS).map((category) => [category.toLowerCase(), category])
);

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const getCategoryName = (image) => {
  const category = image.product?.category?.name || "Engine Parts";
  return CATEGORY_LOOKUP[String(category).toLowerCase()] || "Engine Parts";
};

const buildCandidateUrl = ({ categoryName, imageId, attempt }) => {
  const pool = CATEGORY_IMAGE_POOLS[categoryName] || CATEGORY_IMAGE_POOLS["Engine Parts"];
  const template = pool[attempt % pool.length];
  const lock = hashString(`${categoryName}:${imageId}:${attempt}`);
  if (template.includes("{{lock}}")) {
    return template.replace("{{lock}}", String(lock));
  }
  const separator = template.includes("?") ? "&" : "?";
  return `${template}${separator}autocore=${lock}`;
};

const getUniqueReplacementUrl = ({ image, usedUrls, attemptOffset }) => {
  const categoryName = getCategoryName(image);

  for (let attempt = attemptOffset; attempt < attemptOffset + 500; attempt += 1) {
    const candidate = buildCandidateUrl({
      categoryName,
      imageId: image.id,
      attempt,
    });

    if (!usedUrls.has(candidate)) {
      usedUrls.add(candidate);
      return candidate;
    }
  }

  const fallback = `${buildCandidateUrl({
    categoryName,
    imageId: image.id,
    attempt: attemptOffset,
  })}&autocore=${hashString(image.id)}`;
  usedUrls.add(fallback);
  return fallback;
};

const groupByImageUrl = (images) => {
  const groups = new Map();

  for (const image of images) {
    const list = groups.get(image.imageUrl) || [];
    list.push(image);
    groups.set(image.imageUrl, list);
  }

  return [...groups.values()].filter((group) => group.length > 1);
};

const isBrokenGeneratedUrl = (imageUrl = "") =>
  imageUrl.startsWith("https://source.unsplash.com/");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const updateOneWithRetry = async (prisma, change) => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await prisma.productImage.update({
        where: { id: change.id },
        data: { imageUrl: change.newUrl },
      });
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      await wait(250 * attempt);
    }
  }
};

const updateInBatches = async (prisma, changes) => {
  let updated = 0;
  let index = 0;

  const workers = Array.from(
    { length: Math.min(UPDATE_CONCURRENCY, Math.max(changes.length, 1)) },
    async () => {
      while (index < changes.length) {
        const currentIndex = index;
        index += 1;

        await updateOneWithRetry(prisma, changes[currentIndex]);
        updated += 1;

        if (updated % 50 === 0 || updated === changes.length) {
          console.log(`Updated ${updated}/${changes.length} duplicate images...`);
        }
      }
    }
  );

  await Promise.all(workers);

  return updated;
};

const main = async () => {
  const prisma = getPrisma();
  const images = await prisma.productImage.findMany({
    orderBy: [{ imageUrl: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const duplicateGroups = groupByImageUrl(images);
  const usedUrls = new Set(images.map((image) => image.imageUrl));
  const changeIds = new Set();
  const changes = [];

  const addChange = (image, attemptOffset) => {
    if (changeIds.has(image.id)) return;
    const newUrl = getUniqueReplacementUrl({
      image,
      usedUrls,
      attemptOffset,
    });

    changeIds.add(image.id);
    changes.push({
      id: image.id,
      productName: image.product?.name || "Unknown product",
      sku: image.product?.sku || "",
      category: getCategoryName(image),
      oldUrl: image.imageUrl,
      newUrl,
    });
  };

  duplicateGroups.forEach((group, groupIndex) => {
    const duplicates = group.slice(1);

    duplicates.forEach((image, duplicateIndex) => {
      addChange(image, groupIndex * 1000 + duplicateIndex);
    });
  });

  images
    .filter((image) => isBrokenGeneratedUrl(image.imageUrl))
    .forEach((image, index) => {
      addChange(image, 100000 + index);
    });

  console.log(`DRY_RUN=${DRY_RUN}`);
  console.log(`Update concurrency: ${UPDATE_CONCURRENCY}`);
  console.log(`Total product images checked: ${images.length}`);
  console.log(`Duplicate groups found: ${duplicateGroups.length}`);
  console.log(
    `Broken generated source.unsplash.com URLs found: ${
      images.filter((image) => isBrokenGeneratedUrl(image.imageUrl)).length
    }`
  );
  console.log(`Images ${DRY_RUN ? "that would be updated" : "updated"}: ${changes.length}`);

  if (changes.length) {
    console.log("Preview:");
    changes.slice(0, 10).forEach((change, index) => {
      console.log(
        `${index + 1}. ${change.sku || change.id} | ${change.category} | ${change.productName}`
      );
      console.log(`   old: ${change.oldUrl}`);
      console.log(`   new: ${change.newUrl}`);
    });
  }

  if (!DRY_RUN && changes.length) {
    await updateInBatches(prisma, changes);
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
