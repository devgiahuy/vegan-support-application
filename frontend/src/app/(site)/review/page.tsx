'use client';

import * as React from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/shared/auth-guard';
import { ErrorState } from '@/components/shared/error-state';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/common/enums';
import { LoadingState } from '@/components/shared/loading-state';

/**
 * Trang kiểm duyệt trung gian:
 * - Admin -> Chuyển hướng sang Bảng điều khiển Quản trị (/admin/dashboard?tab=queue).
 * - Contributor -> Chuyển hướng sang Bảng điều khiển Contributor (/contributor/dashboard).
 * - Member / Không đủ quyền -> Hiển thị thông báo từ chối truy cập.
 */
export default function ReviewPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user.role === UserRole.ADMIN) {
      router.replace('/admin/dashboard?tab=queue');
    } else if (user.role === UserRole.CONTRIBUTOR) {
      router.replace('/contributor/dashboard');
    }
  }, [isAuthenticated, router, user]);

  const canReview = user?.role === UserRole.ADMIN || user?.role === UserRole.CONTRIBUTOR;

  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 space-y-6">
        {canReview ? (
          <LoadingState message="Đang chuyển hướng đến không gian kiểm duyệt..." />
        ) : (
          <ForbiddenReviewState />
        )}
      </div>
    </AuthGuard>
  );
}

function ForbiddenReviewState() {
  return (
    <div className="space-y-4">
      <ErrorState title="Bạn không có quyền kiểm duyệt. Trang này chỉ dành cho Người đóng góp có quyền duyệt và Quản trị viên." />
      <p className="text-sm text-muted-foreground">
        Nội dung chờ duyệt được bảo vệ và không hiển thị ở đây.{' '}
        <Link href="/" className="font-medium text-primary hover:underline">
          Về trang chủ
        </Link>
      </p>
    </div>
  );
}
