import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ErrorResponse } from '@/types/api';
import { getAccessToken, setAccessToken } from './auth-token';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from './env';
import { sharedRefresh, forceLogout } from './auth-refresh';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Bỏ qua xử lý lỗi UI toàn cục (toast) cho request này — dùng khi component tự xử lý lỗi. */
    silent?: boolean;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: gắn Bearer token từ Single Source of Truth (memory + zustand)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const storeToken = useAuthStore.getState().token;
    const token = getAccessToken() ?? storeToken;
    if (token && !getAccessToken()) {
      setAccessToken(token);
    }
    if (token && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: refresh token queue (dedup nhiều request 401 cùng lúc)
const failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (reason: unknown) => void;
}> = [];
let queueProcessing = false;

const processQueue = (error: unknown, token: string | null = null) => {
  queueProcessing = false;
  failedQueue.splice(0).forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response) {
      // Lỗi mạng (backend không phản hồi) — để component/query tự xử lý qua getApiErrorMessage.
      return Promise.reject(error);
    }

    const status = error.response.status;
    const isAuthError = status === 401;

    // Chỉ thử refresh khi từng có phiên (token memory/store hoặc user đã persist).
    // Guest chưa đăng nhập gặp 401 thì reject ngay: không gọi refresh vô ích.
    const hadSession =
      !!getAccessToken() || !!useAuthStore.getState().token || !!useAuthStore.getState().user;

    if (
      isAuthError &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/logout') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (!hadSession) {
        return Promise.reject(error);
      }

      if (queueProcessing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      queueProcessing = true;

      try {
        const newToken = await sharedRefresh();
        processQueue(null, newToken || null);
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        forceLogout();
        // TODO(mobile-nav): khi có Expo Router auth group, điều hướng về màn Login ở đây
        // (ví dụ qua một event emitter mà root layout lắng nghe), tương tự
        // `redirectToLoginIfProtected` bên frontend web.
        return Promise.reject(error);
      } finally {
        queueProcessing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function resetAxiosAuthState(): void {
  queueProcessing = false;
  failedQueue.splice(0);
}

export default api;
