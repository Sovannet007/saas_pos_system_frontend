import axios from "axios";
import { loadingStart, loadingStop } from "./loader";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "",
  headers: { "Content-Type": "application/json" },
});

// -------------------- Interceptors for every request --------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  loadingStart();
  return config;
});

// -------------------- Interceptors for every response --------------------
api.interceptors.response.use(
  (res) => {
    loadingStop();
    return res;
  },
  (err) => {
    loadingStop();
    if (err?.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_companies");
      window.location.href = "/unauthorized";
    }
    return Promise.reject(err);
  }
);

// -------------------- Auth Endpoint--------------------
export const login = (payload) => api.post("/api/v1/user/login", payload);
export const selectCompany = (payload) =>
  api.post("/api/v1/user/select-company", payload);
export const getMenuAccess = (payload) =>
  api.post("/api/v1/user/menu-access", payload);

// -------------------- Permission Endpoint --------------------
export const getRolePermissions = (payload) =>
  api.post("/api/v1/user/permissions-on-role", payload);
export const saveRolePermission = (payload) =>
  api.post("/api/v1/user/permissions-role/save-module", payload);

// -------------------- Product Endpoint --------------------
export const getProducts = (payload) =>
  api.post("/api/v1/product/list", payload);

// -------------------- Master Endpoint --------------------
export const getMaster = (payload) =>
  api.post("/api/v1/product/master-list", payload);
export const saveCategory = (payload) => {
  api.post("/api/v1/master/category-save", payload);
};
export const saveUom = (payload) => {
  api.post("/api/v1/master/uom-save", payload);
};

export default api;
