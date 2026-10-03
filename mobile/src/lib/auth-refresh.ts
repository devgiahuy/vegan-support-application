import axios from 'axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from './env';

/**
 * Backend chỉ đặt refreshToken qua HttpOnly cookie, không trả trong JSON body. Mobile dựa vào
 * kho cookie gốc của hệ điều hành (Android CookieManager / iOS NSHTTPCookieStorage): cookie được
 * lưu xuống đĩa khi đăng nhập và tự gửi lại ở `/auth/refresh` nhờ `withCredentials: true`, kể cả
 * sau khi tắt/mở lại app. Việc khôi phục phiên lúc khởi động nằm ở `restoreSession`
 * (`features/auth/lib/restore-session.ts`). Cần kiểm chứng trên thiết bị thật.
 */

const REFRESH_TIMEOUT_MS = 10000;

let refreshPromise: Promise<string | null> | null = null;

/** Dedup nhiều request 401 cùng lúc chỉ gọi refresh một lần. */
export async function sharedRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await axios.post<{ data?: { accessToken?: string } }>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        {},
        { withCredentials: true, timeout: REFRESH_TIMEOUT_MS }
      );
      const accessToken = res.data?.data?.accessToken;
      if (!accessToken) {
        throw new Error('Không nhận được accessToken mới từ /auth/refresh.');
      }
      useAuthStore.getState().setToken(accessToken);
      return accessToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** Đăng xuất cục bộ (xoá token + user trong store) khi refresh thất bại. */
export function forceLogout(): void {
  useAuthStore.getState().logout();
}
