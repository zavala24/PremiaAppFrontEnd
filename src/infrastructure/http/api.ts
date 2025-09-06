// src/infrastructure/http/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://192.168.1.43:5137/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Colocar / limpiar el token globalmente
export const setAuthToken = (token?: string) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};

// Interceptor de errores (mensaje amigable)
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    const message = err?.response?.data?.message || err.message || "Error de red";
    if (status === 401) console.warn("401: sesión expirada");
    if (status === 403) console.warn("403: sin permisos");
    return Promise.reject(new Error(message));
  }
);
