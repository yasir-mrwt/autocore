const MAX_RECENT_ITEMS = 12;

const getRecentKey = (userId = "guest") => `autocore_recently_viewed_${userId}`;

export const getRecentlyViewed = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(getRecentKey(userId)) || "[]");
  } catch {
    return [];
  }
};

export const addRecentlyViewed = (userId, product) => {
  if (!product?.id) return [];

  const current = getRecentlyViewed(userId);
  const nextItem = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    stock: product.stock || 50,
    viewedAt: new Date().toISOString(),
  };
  const next = [
    nextItem,
    ...current.filter((item) => item.id !== product.id),
  ].slice(0, MAX_RECENT_ITEMS);

  localStorage.setItem(getRecentKey(userId), JSON.stringify(next));
  return next;
};

export const removeRecentlyViewed = (userId, productId) => {
  const next = getRecentlyViewed(userId).filter((item) => item.id !== productId);
  localStorage.setItem(getRecentKey(userId), JSON.stringify(next));
  return next;
};

export const clearRecentlyViewed = (userId) => {
  localStorage.removeItem(getRecentKey(userId));
};
