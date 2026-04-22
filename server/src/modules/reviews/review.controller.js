const { getPrisma } = require("../../config/prisma");
const { formatReview } = require("./review.formatters");

const reviewInclude = {
  user: {
    select: {
      id: true,
      name: true,
    },
  },
};

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    String(value || "")
  );

const productIdentityWhere = (value) => ({
  OR: [
    ...(isUuid(value) ? [{ id: value }] : []),
    { slug: value },
    { sku: value },
    { partNumber: value },
  ],
});

const findProduct = (prisma, value) =>
  prisma.product.findFirst({
    where: productIdentityWhere(value),
    select: {
      id: true,
      name: true,
    },
  });

const recalculateProductRating = async (tx, productId) => {
  const aggregate = await tx.review.aggregate({
    where: {
      productId,
      status: "APPROVED",
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  const reviewCount = aggregate._count.rating || 0;
  const averageRating = reviewCount
    ? Number((aggregate._avg.rating || 0).toFixed(2))
    : 0;

  await tx.product.update({
    where: { id: productId },
    data: {
      averageRating,
      reviewCount,
    },
  });

  return {
    averageRating,
    reviewCount,
  };
};

const listProductReviews = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const product = await findProduct(prisma, req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId: product.id,
        status: "APPROVED",
      },
      orderBy: { createdAt: "desc" },
      include: reviewInclude,
    });

    return res.status(200).json({
      reviews: reviews.map(formatReview),
    });
  } catch (error) {
    return next(error);
  }
};

const createOrUpdateProductReview = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const product = await findProduct(prisma, req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const purchasedItem = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          userId: req.user.id,
          paymentStatus: "SUCCEEDED",
          status: {
            notIn: ["CANCELLED", "REFUNDED"],
          },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderId: true,
      },
    });

    if (!purchasedItem) {
      return res.status(403).json({
        message: "Only customers who bought this part can review it.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.review.findFirst({
        where: {
          userId: req.user.id,
          productId: product.id,
        },
      });
      const data = {
        userId: req.user.id,
        productId: product.id,
        orderId: purchasedItem.orderId,
        orderItemId: purchasedItem.id,
        rating: req.body.rating,
        title: req.body.title || null,
        comment: req.body.comment || null,
        status: "APPROVED",
      };
      const review = existing
        ? await tx.review.update({
            where: { id: existing.id },
            data,
            include: reviewInclude,
          })
        : await tx.review.create({
            data,
            include: reviewInclude,
          });
      const productRating = await recalculateProductRating(tx, product.id);

      return {
        review,
        productRating,
        created: !existing,
      };
    });

    return res.status(result.created ? 201 : 200).json({
      message: result.created
        ? "Review created successfully."
        : "Review updated successfully.",
      review: formatReview(result.review),
      productRating: result.productRating,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteProductReview = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const existing = await prisma.review.findFirst({
      where: {
        id: req.params.reviewId,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Review not found." });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: existing.id } });
      const productRating = await recalculateProductRating(tx, existing.productId);

      return { productRating };
    });

    return res.status(200).json({
      message: "Review deleted successfully.",
      productRating: result.productRating,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrUpdateProductReview,
  deleteProductReview,
  listProductReviews,
};
