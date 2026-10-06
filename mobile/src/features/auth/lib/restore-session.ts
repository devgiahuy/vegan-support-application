import { isAxiosError } from 'axios';
import { AppState } from 'react-native';
import * as React from 'react';

import { authApi } from '@/features/auth/api/auth.api';
import { sharedRefresh } from '@/lib/auth-refresh';
import { useAuthStore } from '@/store/useAuthStore';

/** Tối đa chờ khôi phục phiên trước khi cho app hiển thị (tránh treo màn hình chờ khi mạng chậm). */
const RESTORE_MAX_WAIT_MS = 12000;

let inflight: Promise<void> | null = null;

/**
 * Khôi phục phiên đăng nhập sau khi mở lại app: store chỉ lưu `user`, còn access token mất khi
 * app bị kill. Nếu có `user` đã lưu mà chưa có token thì gọi `/auth/refresh` (cookie refresh token
 * do hệ điều hành giữ) để lấy access token mới, rồi đồng bộ lại `user` từ `/users/me`.
 *
 * - Refresh bị từ chối (cookie hết hạn/bị thu hồi/không có) -> đăng xuất cục bộ.
 * - Lỗi mạng/timeout -> giữ nguyên `user`, thử lại khi app quay lại foreground.
 */
export function restoreSession(): Promise<void> {
  if (inflight) return inflight;

  const { user, token } = useAuthStore.getState();
  if (!user || token) return Promise.resolve();

  inflight = (async () => {
    try {
      await sharedRefresh();
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        useAuthStore.getState().logout();
      }
      return;
    }

    try {
      const freshUser = await authApi.getMe();
      if (freshUser.id) useAuthStore.getState().setUser(freshUser);
    } catch {
      // Giữ user đã lưu; token đã khôi phục nên phiên vẫn dùng được.
    }
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

/**
 * Chờ store hydrate từ AsyncStorage rồi khôi phục phiên. Trả `true` khi đã xong (hoặc quá thời hạn
 * chờ) để root layout giữ splash đến lúc đó. Tự thử lại khi app quay lại foreground.
 */
export function useSessionRestore(): boolean {
  const [hydrated, setHydrated] = React.useState(() => useAuthStore.persist.hasHydrated());
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, RESTORE_MAX_WAIT_MS));
    void Promise.race([restoreSession(), timeout]).finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void restoreSession();
    });
    return () => subscription.remove();
  }, []);

  return ready;
}
