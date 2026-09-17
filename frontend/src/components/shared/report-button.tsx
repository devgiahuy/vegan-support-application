'use client';

import * as React from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import type { ReportTargetKind } from '@/common/enums';
import { __isReported } from '@/features/safety/api/safety.api';
import { ReportDialog } from './report-dialog';

/**
 * Nút Báo cáo vi phạm. Ẩn khi chính chủ (không tự báo cáo mình).
 * Trạng thái đã báo cáo tra từ kho fixture (ngày live: query reports).
 */
export function ReportButton({
  targetKind,
  targetId,
  authorId,
}: {
  targetKind: ReportTargetKind;
  targetId: string;
  authorId?: string;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const [open, setOpen] = React.useState(false);
  const [reported, setReported] = React.useState(() => __isReported(targetId));

  if (!isAuthenticated) return null;
  if (authorId && user && authorId === user.id) return null;

  if (reported) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-1.5">
        <Flag data-icon="inline-start" />
        Đã báo cáo
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Flag data-icon="inline-start" />
        Báo cáo
      </Button>
      <ReportDialog
        targetKind={targetKind}
        targetId={targetId}
        open={open}
        onOpenChange={(next) => {
          if (!next) setReported(__isReported(targetId));
          setOpen(next);
        }}
      />
    </>
  );
}
