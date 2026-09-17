'use client';

import * as React from 'react';
import { BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import { ContributorApplicationStatus } from '@/common/enums';
import type { ChatMessage } from '../types/chat.model';
import { VerifyDialog } from './verify-dialog';

/**
 * Nút mở dialog kiểm chứng: chỉ ADMIN hoặc đơn contributor đã duyệt.
 * User thường/khách không thấy nút (render null).
 */
export function VerifyAnswerButton({ messageId }: { messageId: string }) {
  const { user } = useAuthStore();
  const [open, setOpen] = React.useState(false);

  const eligible =
    user?.role === UserRole.ADMIN ||
    user?.contributorApplication?.status === ContributorApplicationStatus.APPROVED;
  if (!eligible) return null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Kiểm chứng câu trả lời"
        onClick={() => setOpen(true)}
      >
        <BadgeCheck className="size-4" />
      </Button>
      <VerifyDialog messageId={messageId} open={open} onOpenChange={setOpen} />
    </>
  );
}
