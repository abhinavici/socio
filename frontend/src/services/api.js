import axios from "axios";
import { clearToken, getToken, isTokenExpired } from "../utils/auth";

export const AUTH_LOGOUT_EVENT = "auth:logout";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE_URL,
});

const notifyLogout = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
};

API.interceptors.request.use((req) => {
  const token = getToken();

  if (token) {
    if (isTokenExpired(token)) {
      clearToken();
      notifyLogout();
      return req;
    }

    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
      notifyLogout();
    }

    return Promise.reject(error);
  }
);

export default API;
