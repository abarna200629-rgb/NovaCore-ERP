import { API_BASE_URL } from "../config";
import axios from "axios";

const api = axios.create({
  baseURL: API_BASE_URL + "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("TOKEN =", token); // DEBUG
  if (token) {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  return config;
});

// Response interceptor for JWT Expiry (401) and Access Denied (403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        localStorage.clear();
        window.location.href = "/?expired=true";
      } else if (status === 403) {
        window.location.href = "/403";
      }
    }
    return Promise.reject(error);
  }
);

export default api;