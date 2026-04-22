const formatReview = (review) => ({
  id: review.id,
  productId: review.productId,
  orderId: review.orderId,
  orderItemId: review.orderItemId,
  rating: review.rating,
  title: review.title,
  comment: review.comment,
  status: review.status,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
  customer: review.user
    ? {
        id: review.user.id,
        name: review.user.name,
      }
    : null,
});

module.exports = {
  formatReview,
};
