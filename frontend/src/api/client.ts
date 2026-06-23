import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import type { ApiErrorBody, Token } from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

const ACCESS_KEY = "storyscout.access";
const REFRESH_KEY = "storyscout.refresh";

export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(tokens: Token) {
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

/** The versioned API root the browser talks to, e.g. "/api/v1". */
export const API_V1 = `${API_BASE_URL}/v1`;

export const http: AxiosInstance = axios.create({
  baseURL: API_V1,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Single-flight refresh: queue concurrent 401s behind one refresh call.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.refresh;
  if (!refresh) return null;
  try {
    const res = await axios.post<Token>(
      `${API_V1}/auth/refresh`,
      null,
      { params: { refresh_token: refresh } },
    );
    tokenStore.set(res.data);
    return res.data.access_token;
  } catch {
    tokenStore.clear();
    return null;
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const isAuthRoute = original?.url?.includes("/auth/");
    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return http(original);
      }
      // Refresh failed — bubble up so the app can redirect to login.
      window.dispatchEvent(new CustomEvent("storyscout:logout"));
    }
    return Promise.reject(error);
  },
);

/** Extract a human-friendly message from an Axios error. */
export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorBody | undefined;
    if (data?.detail) return data.detail;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
