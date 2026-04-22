import catalogClient from "./catalogService";

export const getProductReviews = async (productId) => {
  const { data } = await catalogClient.get(`/reviews/products/${productId}`);
  return data.reviews || [];
};

export const saveProductReview = async (productId, payload) => {
  const { data } = await catalogClient.post(
    `/reviews/products/${productId}`,
    payload
  );
  return data;
};

export const deleteProductReview = async (reviewId) => {
  const { data } = await catalogClient.delete(`/reviews/${reviewId}`);
  return data;
};
