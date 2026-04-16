import axios from "axios";
import { getAccessToken, getRefreshToken, getUserType } from "./Token";

const axiosInstance = axios.create({
  // baseURL: "http://localhost:3001/",
  // baseURL: "https://car-dealership-backend.vercel.app/",
  // baseURL: "https://car-dealership-backend.onrender.com/",
  baseURL: "https://car-dealership-backend-production.up.railway.app/",
});

axiosInstance.interceptors.request.use(
  (config) => {
    config.headers["Authorization"] = `Bearer ${getAccessToken()}`;
    config.headers["Refresh-Token"] = getRefreshToken();
    config.headers["User-Type"] = getUserType();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
