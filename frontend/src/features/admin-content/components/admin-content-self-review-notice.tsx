'use client';

import * as React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AdminContentSelfReviewNoticeProps {
  /** Chỉ hiện khi nội dung do chính quản trị viên đang xem là tác giả. */
  visible: boolean;
}

/**
 * Cảnh báo cấm tự duyệt (FR-035, quyết định Q2).
 *
 * Quy tắc này **không thể** nới lỏng ở phía giao diện: máy chủ trả
 * `SELF_APPROVAL_FORBIDDEN`. Giao diện chỉ nói rõ trước để quản trị viên không
 * gửi yêu cầu chắc chắn thất bại.
 */
export function AdminContentSelfReviewNotice({ visible }: AdminContentSelfReviewNoticeProps) {
  if (!visible) return null;

  return (
    <Alert
      role="note"
      className="border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400"
    >
      <ShieldAlert className="h-4 w-4" aria-hidden="true" />
      <AlertTitle className="text-sm font-semibold text-amber-900 dark:text-amber-300">
        Không thể tự duyệt nội dung của chính mình
      </AlertTitle>
      <AlertDescription className="mt-1 text-xs sm:text-sm text-amber-800/90 dark:text-amber-200/90">
        Nội dung bạn đăng phải được ít nhất một quản trị viên khác duyệt trước khi công khai. Nếu hệ
        thống hiện chỉ có một quản trị viên, nội dung sẽ chờ ở trạng thái chờ duyệt.
      </AlertDescription>
    </Alert>
  );
}
