'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/common/enums';
import { LoadingState } from './loading-state';
import { ErrorState } from './error-state';

/**
 * Guard phía client cho route cần đăng nhập / phân quyền.
 * Dùng kèm middleware.ts (check token + role ADMIN ở Edge).
 *
 * @example
 * <AuthGuard roles={[UserRole.ADMIN]}><AdminPanel /></AuthGuard>
 */
export function AuthGuard({
  children,
  roles,
  loginPath = '/login',
}: {
  children: React.ReactNode;
  roles?: UserRole[];
  loginPath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`${loginPath}?from=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, loginPath, pathname, router]);

  if (!isAuthenticated) {
    return <LoadingState message="Đang kiểm tra phiên đăng nhập..." />;
  }

  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
    return <ErrorState title="Bạn không có quyền truy cập trang này." />;
  }

  return <>{children}</>;
}
