'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getAccessToken, setAccessToken } from '@/lib/auth-token';
import { sharedRefresh, forceLogout } from '@/lib/auth-refresh';
import { LoadingState } from '@/components/shared/loading-state';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      const token = useAuthStore.getState().token ?? getAccessToken();
      if (!token && useAuthStore.getState().user) {
        try {
          await sharedRefresh();
        } catch {
          await forceLogout().catch(() => undefined);
        }
      } else if (token && !getAccessToken()) {
        setAccessToken(token);
      }
      // Checkout returns reload the app; mount guards after refresh settles.
      if (mounted) setIsHydrated(true);
    }
    void restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  if (!isHydrated) {
    return <LoadingState message="Đang khôi phục phiên đăng nhập…" />;
  }

  return <>{children}</>;
}
