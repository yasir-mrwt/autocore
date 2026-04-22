import axios from "axios";
import { getAccessToken, getRefreshToken, getUserType } from "./Token";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_LEGACY_API_BASE_URL || "http://localhost:8000/",
});

axiosInstance.interceptors.request.use(
  (config) => {
    const role = config.headers?.["User-Type"] === "Admin" ? "Admin" : "Buyer";
    config.headers["Authorization"] = `Bearer ${getAccessToken(role)}`;
    config.headers["Refresh-Token"] = getRefreshToken(role);
    config.headers["User-Type"] = getUserType(role);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
