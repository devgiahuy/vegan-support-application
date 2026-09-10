'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getAccessToken, setAccessToken } from '@/lib/auth-token';
import { authApi } from '@/features/auth/api/auth.api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Đảm bảo Zustand persist (chỉ còn user) đã hydrate xong
    setIsHydrated(true);

    // Token chỉ giữ in-memory -> sau F5 memory mất.
    // Thử silent-refresh bằng HttpOnly cookie để khôi phục session mà không bắt login lại.
    const token = useAuthStore.getState().token ?? getAccessToken();
    if (!token) {
      authApi
        .refreshToken()
        .then((newToken) => {
          if (newToken) {
            setAccessToken(newToken);
            useAuthStore.getState().setToken(newToken);
            return authApi.getMe().then((user) => useAuthStore.getState().setUser(user));
          }
        })
        .catch(() => {
          // Không có cookie hợp lệ -> giữ trạng thái guest, không toast
        });
    } else if (token && !getAccessToken()) {
      setAccessToken(token);
    }
  }, []);

  if (!isHydrated) {
    // Tránh hydration mismatch khi server render
    return null;
  }

  return <>{children}</>;
}
