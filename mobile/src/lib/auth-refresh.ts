import axios from 'axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from './env';

/**
 * TODO(mobile-auth): Backend chỉ đặt refreshToken qua HttpOnly cookie
 * (`backend/src/modules/auth/auth.controller.ts`), không trả trong JSON body.
 * RN không có `document.cookie`/localStorage như web nên cơ chế "sống sót qua khi
 * kill app" của cookie native chưa được kiểm chứng ổn định trên mọi thiết bị.
 * Hàm dưới đây gọi `/auth/refresh` với `withCredentials: true` (dựa vào cookie jar
 * native của RN còn hiệu lực trong phiên app đang mở). Cần quyết định chiến lược
 * lâu dài (cookie-jar lib riêng, hay đổi hợp đồng BE cho mobile) trước khi coi
 * luồng "giữ đăng nhập sau khi tắt app" là hoàn thiện.
 */

let refreshPromise: Promise<string | null> | null = null;

/** Dedup nhiều request 401 cùng lúc chỉ gọi refresh một lần. */
export async function sharedRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await axios.post<{ data?: { accessToken?: string } }>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        {},
        { withCredentials: true }
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
