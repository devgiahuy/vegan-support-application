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
    <Alert role="note">
      <ShieldAlert className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Không thể tự duyệt nội dung của chính mình</AlertTitle>
      <AlertDescription>
        Nội dung bạn đăng phải được ít nhất một quản trị viên khác duyệt trước khi công khai. Nếu hệ
        thống hiện chỉ có một quản trị viên, nội dung sẽ chờ ở trạng thái chờ duyệt.
      </AlertDescription>
    </Alert>
  );
}
