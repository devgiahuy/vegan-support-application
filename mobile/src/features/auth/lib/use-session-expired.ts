import * as React from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { router, usePathname, type Href } from 'expo-router';

import { onSessionExpired } from '@/lib/auth-refresh';

/** Route (theo `usePathname`) chỉ dùng được khi đã đăng nhập; trang public giữ nguyên khi hết phiên. */
const PROTECTED_PREFIXES = [
  '/profile',
  '/assistant',
  '/pantry',
  '/bookmarks',
  '/my-content',
  '/custom-meals',
  '/meal-plans',
  '/meal-programs',
  '/diet-preferences',
  '/diet-schedule',
  '/fridge-scan',
  '/receipt-scan',
  '/shopping-preview',
  '/contributor-status',
  '/restaurants/mine',
  '/restaurants/new',
  '/recipes/new',
  '/articles/new',
  '/videos/new',
];

export function isProtectedPath(pathname: string): boolean {
  if (pathname.endsWith('/edit')) return true;
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Khi refresh token thất bại (`forceLogout`): xoá cache theo phiên cũ và, nếu đang ở màn cần đăng
 * nhập, mở màn đăng nhập (kèm thông báo hết phiên) — tương tự `redirectToLoginIfProtected` của web.
 * Màn public giữ nguyên, không bật hộp thoại gây khó chịu. Gọi một lần ở root layout.
 */
export function useSessionExpiredRedirect(queryClient: QueryClient): void {
  const pathname = usePathname();
  const pathnameRef = React.useRef(pathname);

  React.useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  React.useEffect(() => {
    return onSessionExpired(() => {
      queryClient.clear();
      const current = pathnameRef.current;
      if (current.startsWith('/login') || current.startsWith('/register')) return;
      if (!isProtectedPath(current)) return;
      router.push('/(auth)/login?expired=1' as Href);
    });
  }, [queryClient]);
}
