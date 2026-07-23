import axios, { AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { env } from "./env";
import { STORAGE_KEYS, API_ROUTES, ROUTES } from "./constants";

/**
 * Central Axios instance used by the frontend to talk to the Express backend.
 *
 * - Attaches the access token from localStorage on every request.
 * - Unwraps the backend's `{ success, message, data }` envelope so callers get
 *   the payload directly on `response.data`.
 * - On 401 for an authed request, transparently refreshes tokens and retries
 *   the original request once. If refresh fails, clears storage and bounces
 *   the browser to the login page (auto-logout on invalid refresh token).
 */

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const getStorage = () => (typeof window !== "undefined" ? window.localStorage : null);

export const tokenStorage = {
  getAccess: () => getStorage()?.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? null,
  getRefresh: () => getStorage()?.getItem(STORAGE_KEYS.REFRESH_TOKEN) ?? null,
  set: (access: string, refresh?: string) => {
    const s = getStorage();
    if (!s) return;
    s.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    if (refresh) s.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  },
  clear: () => {
    const s = getStorage();
    if (!s) return;
    s.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    s.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Unwrap the standard `{ success, message, data }` envelope in place so callers
 * receive the payload directly on `response.data`.
 */
function unwrapEnvelope(res: AxiosResponse): AxiosResponse {
  const body = res.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    res.data = (body as { data: unknown }).data;
  }
  return res;
}

const NO_REFRESH_PATHS = ["/auth/login", "/auth/signup", "/auth/refresh"];

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = tokenStorage.getRefresh();

  refreshInFlight = (async () => {
    try {
      const { data } = await axios.post(
        `${env.API_URL}${API_ROUTES.AUTH.REFRESH}`,
        refreshToken ? { refreshToken } : {},
        { withCredentials: true },
      );
      // Envelope: { success, message, data: { user, accessToken, refreshToken } }
      const payload = (data?.data ?? data) as { accessToken?: string; refreshToken?: string };
      if (!payload?.accessToken) return null;
      tokenStorage.set(payload.accessToken, payload.refreshToken);
      return payload.accessToken;
    } catch {
      tokenStorage.clear();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

apiClient.interceptors.response.use(
  (res) => unwrapEnvelope(res),
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    const url = original?.url ?? "";
    const isRefreshableEndpoint = !NO_REFRESH_PATHS.some((p) => url.includes(p));
    const wasAuthed = Boolean((original?.headers as Record<string, string> | undefined)?.Authorization);

    if (status === 401 && original && !original._retry && isRefreshableEndpoint && wasAuthed) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      // Refresh failed → auto-logout.
      tokenStorage.clear();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith(ROUTES.LOGIN)) {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `${ROUTES.LOGIN}?redirect=${returnTo}`;
      }
    }
    return Promise.reject(error);
  },
);

export type ApiError = {
  message: string;
  code?: string;
  status?: number;
  fields?: Record<string, string>;
};

export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Partial<ApiError> | undefined;
    return {
      message: data?.message ?? err.message ?? "Something went wrong",
      code: data?.code,
      status: err.response?.status,
      fields: data?.fields,
    };
  }
  if (err instanceof Error) return { message: err.message };
  return { message: "Unknown error" };
}
