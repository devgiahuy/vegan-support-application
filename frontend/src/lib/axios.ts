import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { ErrorResponse } from '@/types/api';
import { getAccessToken, setAccessToken, clearAccessToken } from './auth-token';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from './env';

declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean;
    showErrorToast?: boolean;
    errorToastMessage?: string;
  }
}

const api = axios.create({
  // Next.js API route proxy hoặc direct backend (lấy từ lib/env.ts đã validate)
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: inject token từ Single Source of Truth (memory + zustand)
// KHÔNG đọc trực tiếp localStorage ở đây nữa để tránh lệch với HttpOnly cookie.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const storeToken = useAuthStore.getState().token;
    const token = getAccessToken() ?? storeToken;
    // Tự sync lại memory nếu store còn token (trường hợp hydrate sau F5)
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

// Response Interceptor: Refresh token queue & toast handling
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];
let hasShownSessionExpiredToast = false;

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as any;
    const silent = originalRequest?.silent === true;
    const showErrorToast = originalRequest?.showErrorToast === true;
    const customErrorMessage = originalRequest?.errorToastMessage;

    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      // Kiểm tra lỗi xác thực 401
      const isAuthError =
        status === 401 ||
        (status === 500 &&
          (errorData?.message === 'Vui lòng đăng nhập' ||
            errorData?.detail === 'Vui lòng đăng nhập' ||
            errorData?.Detail === 'Vui lòng đăng nhập'));

      if (
        isAuthError &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login')
      ) {
        if (
          originalRequest.url?.includes('/auth/logout') ||
          originalRequest.url?.includes('/auth/refresh-token')
        ) {
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => api(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Gọi Next Route Handler /api/auth/refresh-token (proxy tới BE, gửi HttpOnly cookie).
          // Handler này đã được tạo ở src/app/api/auth/refresh-token/route.ts
          const refreshRes = await axios.post('/api/auth/refresh-token', {}, { baseURL: '' });
          // BE có thể trả {access_token | accessToken | token} hoặc {data: {...}}
          const payload = (refreshRes.data as any)?.data ?? refreshRes.data;
          const newToken: string =
            payload?.access_token ?? payload?.accessToken ?? payload?.token ?? '';

          if (newToken) {
            setAccessToken(newToken);
            useAuthStore.getState().setToken(newToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
          }
          processQueue(null, newToken || null);
          hasShownSessionExpiredToast = false;
          return api(originalRequest);
        } catch (err) {
          processQueue(err, null);
          clearAccessToken();
          useAuthStore.getState().logout();
          if (!hasShownSessionExpiredToast && !silent) {
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            hasShownSessionExpiredToast = true;
          }
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      // Xử lý thông báo lỗi toast tự động
      if (!silent) {
        if (customErrorMessage) {
          toast.error(customErrorMessage);
        } else if (status >= 500) {
          toast.error('Lỗi hệ thống máy chủ. Vui lòng thử lại sau.');
        } else if (status === 403) {
          toast.error(
            errorData?.message || errorData?.detail || 'Bạn không có quyền thực hiện thao tác này.'
          );
        } else if (status === 429) {
          toast.error('Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
        } else if (showErrorToast) {
          toast.error(
            errorData?.message ||
              errorData?.detail ||
              errorData?.title ||
              'Thao tác thất bại. Vui lòng thử lại.'
          );
        }
      }
    } else if (error.request) {
      if (!silent) {
        toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
