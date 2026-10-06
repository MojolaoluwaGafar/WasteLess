import axios from "axios";
import { clearAuth, getToken } from "../utils/authToken";

// The API's address, from VITE_BASE_URL at build time. A bare host
// ("wasteless-api.onrender.com") or a trailing slash is accepted, since both
// are easy to paste into a dashboard. In development it falls back to the
// Server's default port, so the app runs without a .env file. The first
// version had addresses typed into each page, and one of them still pointed
// at localhost in production.
// VITE_BACKEND_URL is the name the live Vercel project already has.
const rawBaseUrl = (import.meta.env.VITE_BASE_URL || import.meta.env.VITE_BACKEND_URL || "").trim().replace(/\/+$/, "");
const configuredUrl = rawBaseUrl && !/^https?:\/\//i.test(rawBaseUrl) ? `https://${rawBaseUrl}` : rawBaseUrl;
export const API_BASE_URL: string =
  configuredUrl || (import.meta.env.DEV ? `http://${window.location.hostname}:5050` : "https://foodwastereduction-backend.onrender.com");

// Fired when the server says the login is no longer valid, so AuthContext
// can sign out and protected pages send the person to the login page.
export const SIGNED_OUT_EVENT = "wasteless:signed-out";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  // Long enough for a free Render server to wake up.
  timeout: 60_000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? "";
    // 401 means the login is missing, expired or was revoked. A wrong
    // password at sign-in answers 401 too, so skip the auth forms.
    if (status === 401 && getToken() && !url.startsWith("/api/auth/login")) {
      clearAuth();
      window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
    }
    return Promise.reject(error);
  },
);

export default api;
