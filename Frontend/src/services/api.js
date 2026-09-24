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
      token = window.localStorage.getItem("token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/verify-otp") &&
      !originalRequest.url?.includes("/auth/refresh-token")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const rawSession = window.localStorage.getItem("evora-session");
      if (rawSession) {
        try {
          const session = JSON.parse(rawSession);
          if (session.refreshToken) {
            const refreshRes = await axios.post(`${env.apiUrl}/auth/refresh-token`, {
              refreshToken: session.refreshToken,
            });

            if (refreshRes.data?.success && refreshRes.data?.data?.accessToken) {
              const newAccessToken = refreshRes.data.data.accessToken;
              const newRefreshToken = refreshRes.data.data.refreshToken || session.refreshToken;

              session.accessToken = newAccessToken;
              session.refreshToken = newRefreshToken;

              try {
                window.localStorage.setItem("evora-session", JSON.stringify(session));
              } catch (e) {
                console.warn("Could not save refreshed session to localStorage:", e);
              }

              api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

              processQueue(null, newAccessToken);
              isRefreshing = false;
              return api(originalRequest);
            }
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          window.localStorage.removeItem("evora-session");
          window.localStorage.removeItem("admin_token");
          window.localStorage.removeItem("token");
          return Promise.reject(refreshErr);
        }
      }

      isRefreshing = false;
      window.localStorage.removeItem("evora-session");
      window.localStorage.removeItem("admin_token");
      window.localStorage.removeItem("token");
    }

    return Promise.reject(error);
  }
);

export default api;
