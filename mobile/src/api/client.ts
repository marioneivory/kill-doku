import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "./tokenStorage";

// Impostata via variabile d'ambiente Expo pubblica (vedi .env.example e README).
// Fallback a localhost solo per lo sviluppo con simulatore sulla stessa macchina.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Le rotte di auth non richiedono un access token
  const isAuthRoute = config.url?.startsWith("/auth");
  if (!isAuthRoute) {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

/**
 * Su 401 (access token scaduto), prova UNA VOLTA a fare il refresh e
 * ripete la richiesta originale. Le richieste concorrenti durante il
 * refresh vengono accodate ed eseguite dopo, per evitare refresh multipli
 * in parallelo che invaliderebbero a vicenda i token (rotazione lato server).
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.startsWith("/auth")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => pendingRequests.push(resolve));
        return apiClient(originalRequest);
      }

      isRefreshing = true;
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error("Nessun refresh token disponibile");

        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        await saveTokens(data.accessToken, data.refreshToken);

        pendingRequests.forEach((resolve) => resolve());
        pendingRequests = [];

        return apiClient(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        pendingRequests = [];
        // Propaga: la UI (authStore) reagirà riportando l'utente al login.
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
