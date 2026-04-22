import axios from "axios";
import SparePartImg from "/assets/image/spare_part.png";
import { getAccessToken, setAccessToken } from "../utils/Token";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const catalogClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

catalogClient.interceptors.request.use((config) => {
  const role =
    config.authRole ||
    (String(config.url || "").includes("/admin/") ? "Admin" : "Buyer");
  const token = getAccessToken(role);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.authRole = role;
  return config;
});

catalogClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const role = originalRequest.authRole || "Buyer";
    const requestUrl = String(originalRequest.url || "");
    const hasTabSession = Boolean(
      originalRequest.headers?.Authorization || getAccessToken(role)
    );
    const isNonRefreshableAuthRoute =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/admin/login") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/admin/refresh") ||
      requestUrl.includes("/auth/logout") ||
      requestUrl.includes("/auth/admin/logout");

    if (
      error?.response?.status !== 401 ||
      originalRequest._retry ||
      !hasTabSession ||
      isNonRefreshableAuthRoute
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const endpoint = role === "Admin" ? "/auth/admin/refresh" : "/auth/refresh";
      const { data } = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        {},
        { withCredentials: true }
      );
      setAccessToken(data.accessToken, role);
      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${data.accessToken}`,
      };
      return catalogClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(error);
    }
  }
);

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
  );

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeProduct = (product = {}) => {
  const images = (product.images || [])
    .map((image) => image.imageUrl || image)
    .filter(Boolean);
  const image = product.image || images[0] || SparePartImg;
  const category = product.category?.name || product.category || "Auto Parts";
  const price = toNumber(product.price);
  const originalPrice =
    product.originalPrice === null || product.originalPrice === undefined
      ? null
      : toNumber(product.originalPrice);
  const availableStock =
    product.inventory?.availableStock ?? product.stock ?? product.quantity ?? 0;
  const compatibilities = product.compatibilities || [];
  const firstFitment = compatibilities[0];

  return {
    ...product,
    id: product.id,
    slug: product.slug,
    name: product.name || "Auto Part",
    subtitle:
      product.shortDescription ||
      product.subtitle ||
      "Reliable replacement part for everyday driving",
    category,
    categorySlug: product.category?.slug,
    make: firstFitment?.brand?.name || product.make || "Universal",
    sku: product.sku || product.partNumber || "",
    partNumber: product.partNumber || product.sku || "",
    price,
    originalPrice,
    rating: Math.round(toNumber(product.averageRating ?? product.rating, 0)),
    reviews: toNumber(product.reviewCount ?? product.reviews, 0),
    badge: originalPrice ? "sale" : product.badge,
    image,
    images: images.length ? images : [image],
    inStock: product.inventory?.inStock ?? product.inStock ?? availableStock > 0,
    stock: availableStock,
    color: product.color || "OEM Finish",
    fabric: product.fabric || "Automotive Grade",
    discount: originalPrice
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : product.discount || 0,
    details:
      product.details ||
      [
        product.shortDescription || "Quality checked replacement part",
        product.partNumber ? `Part number ${product.partNumber}` : "Fitment-ready design",
        firstFitment?.brand?.name
          ? `${firstFitment.brand.name} compatible`
          : "Universal compatibility options",
      ],
    compatibilities,
  };
};

export const getProducts = async (params = {}) => {
  const { data } = await catalogClient.get("/catalog/products", {
    params: cleanParams(params),
  });

  return {
    products: (data.products || []).map(normalizeProduct),
    pagination: data.pagination,
  };
};

export const getAdminProducts = async (params = {}) => {
  const { data } = await catalogClient.get("/catalog/admin/products", {
    authRole: "Admin",
    params: cleanParams(params),
  });

  return {
    products: (data.products || []).map(normalizeProduct),
    pagination: data.pagination,
  };
};

export const createAdminProduct = async (payload) => {
  const { data } = await catalogClient.post("/catalog/admin/products", payload, {
    authRole: "Admin",
  });
  return normalizeProduct(data.product);
};

export const updateAdminProduct = async (idOrSlug, payload) => {
  const { data } = await catalogClient.patch(
    `/catalog/admin/products/${idOrSlug}`,
    payload,
    { authRole: "Admin" }
  );
  return normalizeProduct(data.product);
};

export const archiveAdminProduct = async (idOrSlug) => {
  const { data } = await catalogClient.delete(
    `/catalog/admin/products/${idOrSlug}`,
    { authRole: "Admin" }
  );
  return normalizeProduct(data.product);
};

export const getProduct = async (idOrSlug) => {
  const { data } = await catalogClient.get(`/catalog/products/${idOrSlug}`);
  return normalizeProduct(data.product);
};

export const getRelatedProducts = async (idOrSlug, params = {}) => {
  const { data } = await catalogClient.get(
    `/catalog/products/${idOrSlug}/related`,
    {
      params: cleanParams(params),
    }
  );

  return (data.products || []).map(normalizeProduct);
};

export const getCategories = async () => {
  const { data } = await catalogClient.get("/catalog/categories");
  return data.categories || [];
};

export const getBrands = async () => {
  const { data } = await catalogClient.get("/catalog/brands");
  return data.brands || [];
};

export default catalogClient;
