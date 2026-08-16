import axios from "axios";
import { env } from "../config/env";

const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
});

export default api;
