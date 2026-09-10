'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Đảm bảo Zustand state từ localStorage đã được load xong trên Client
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    // Tránh hydration mismatch khi server render
    return null;
  }

  return <>{children}</>;
}
