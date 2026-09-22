import axios from "axios";
import { env } from "../config/env";

const adminApi = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
});

adminApi.interceptors.request.use(
  (config) => {
    // Strictly use the admin_token for adminApi calls
    const token = window.localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only remove the admin token to avoid breaking the user session
      window.localStorage.removeItem("admin_token");
    }
    return Promise.reject(error);
  }
);

export default adminApi;
