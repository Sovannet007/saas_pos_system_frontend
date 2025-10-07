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
// export the api for use in components
export { api };

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

export const printProduct = (payload) =>
  api.post("/api/v1/product/print", payload);

export const saveProduct = (payload) =>
  api.post("/api/v1/product/save", payload);

export const getProductDetail = ({ id }) =>
  api.get(`/api/v1/product/detail/${id}`);

// ✅ New: Upload & delete photo
export const uploadProductPhoto = (formData) =>
  api.post("/api/v1/product/upload-photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getProductMedia = (productId) =>
  api.post("/api/v1/product/media-list", productId);

export const deleteProductPhoto = (payload) =>
  api.post("/api/v1/product/delete-photo", payload);

// -------------------- Master Endpoint --------------------
export const getMaster = (payload) => api.post("/api/v1/master/list", payload);
export const saveMaster = (payload) => api.post("/api/v1/master/save", payload);
export const deleteMaster = (payload) => {
  api.post("/api/v1/master/master-delete", payload);
};

// -------------------- User Management Endpoint --------------------
export const getUserList = (payload) => api.post("/api/v1/user/list", payload);
export const saveUser = (payload) => api.post("/api/v1/user/save", payload);
export const changePassword = (payload) =>
  api.post("/api/v1/user/change-password", payload);

export default api;
