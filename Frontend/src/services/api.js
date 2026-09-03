import axios from "axios";
import { env } from "../config/env";

const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const sessionStr = window.localStorage.getItem("evora-session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
      } catch (err) {
        console.error("Failed to parse session", err);
      }
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
      // Optional: Emit event or reload to push user to login
      // window.dispatchEvent(new Event("auth-expired"));
    }
    return Promise.reject(error);
  }
);

export default api;
