import axios from "axios";
import { env } from "../config/env";

const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    let token = null;

    const sessionStr = window.localStorage.getItem("evora-session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.accessToken) {
          token = session.accessToken;
        }
      } catch (err) {
        console.error("Failed to parse session", err);
      }
    }

    if (!token) {
      token = window.localStorage.getItem("admin_token") || window.localStorage.getItem("token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.localStorage.removeItem("evora-session");
      window.localStorage.removeItem("admin_token");
      window.localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default api;
