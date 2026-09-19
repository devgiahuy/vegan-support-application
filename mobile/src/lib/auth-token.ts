/**
 * Single Source of Truth cho accessToken (in-memory).
 * - Không đọc trực tiếp AsyncStorage trong interceptor để tránh lệch trạng thái.
 * - Zustand store (`useAuthStore`) đồng bộ vào đây qua setSession/setToken.
 * - Kill/mở lại app -> memory mất -> cần silent-refresh hoặc yêu cầu đăng nhập lại
 *   (xem TODO trong `lib/auth-refresh.ts` về chiến lược refresh token trên mobile).
 */

let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function clearAccessToken() {
  _accessToken = null;
}
