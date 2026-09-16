'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getAccessToken, setAccessToken } from '@/lib/auth-token';
import { sharedRefresh } from '@/lib/auth-refresh';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);

    const token = useAuthStore.getState().token ?? getAccessToken();
    if (!token) {
      // Chỉ silent-refresh nếu có khả năng có refresh cookie.
      // Tránh gọi vô ích cho guest: kiểm tra cookie refreshToken có tồn tại.
      const hasRefreshCookie =
        typeof document !== 'undefined' && document.cookie.includes('refreshToken');
      if (!hasRefreshCookie) return;

      void sharedRefresh().catch(() => {
        // Không có phiên hợp lệ -> giữ guest, không toast (axios interceptor sẽ toast khi cần)
      });
    } else if (token && !getAccessToken()) {
      setAccessToken(token);
    }
  }, []);

  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}
