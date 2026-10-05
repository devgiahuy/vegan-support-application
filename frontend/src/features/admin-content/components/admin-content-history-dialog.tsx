'use client';

import * as React from 'react';
import { History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { formatDate } from '@/lib/utils';
import { useAdminContentHistoryQuery } from '../queries/admin-content.queries';
import type { AdminContentRow } from '../types/admin-content.model';

function formatDateSafe(value: Date | null): string {
  if (!value) return '—';
  try {
    return formatDate(value);
  } catch {
    return '—';
  }
}

interface AdminContentHistoryDialogProps {
  row: AdminContentRow | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Hộp thoại lịch sử duyệt của một nội dung (FR-033).
 *
 * Tín hiệu kiểm duyệt tự động chỉ hiển thị với nhãn "tín hiệu" và **không** kích
 * hoạt ẩn/xoá (FR-036, SC-012).
 */
export function AdminContentHistoryDialog({ row, onOpenChange }: AdminContentHistoryDialogProps) {
  const historyQuery = useAdminContentHistoryQuery(row?.id ?? '', undefined, row !== null);
  const data = historyQuery.data;

  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" aria-hidden="true" />
            Lịch sử duyệt: {row?.title ?? ''}
          </DialogTitle>
          <DialogDescription>
            Mỗi mốc ghi phiên bản, trạng thái, thời điểm, người quyết định và lý do.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          {historyQuery.isLoading && (
            <div className="space-y-2" aria-busy="true">
              <span className="sr-only">Đang tải lịch sử duyệt...</span>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          )}

          {!historyQuery.isLoading && historyQuery.isError && (
            <ErrorState
              title="Không tải được lịch sử duyệt."
              onRetry={() => void historyQuery.refetch()}
            />
          )}

          {!historyQuery.isLoading &&
            !historyQuery.isError &&
            (data?.revisions.length ?? 0) === 0 && (
              <EmptyState
                title="Chưa có lịch sử duyệt."
                description="Nội dung chưa từng được gửi duyệt."
              />
            )}

          {!historyQuery.isLoading &&
            !historyQuery.isError &&
            (data?.revisions.length ?? 0) > 0 && (
              <ol className="space-y-3">
                {data?.revisions.map((entry) => (
                  <li key={entry.revisionId} className="rounded-xl border border-border/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">Phiên bản {entry.revisionVersion}</span>
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {entry.statusLabel}
                      </Badge>
                    </div>
                    <dl className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <div className="flex gap-1.5">
                        <dt>Đã gửi:</dt>
                        <dd>{formatDateSafe(entry.submittedAt)}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt>Đã duyệt:</dt>
                        <dd>{formatDateSafe(entry.reviewedAt)}</dd>
                      </div>
                      {entry.reviewNote && (
                        <div className="flex gap-1.5 sm:col-span-2">
                          <dt>Lý do:</dt>
                          <dd className="text-foreground">{entry.reviewNote}</dd>
                        </div>
                      )}
                    </dl>
                    {entry.isCurrentPublished && (
                      <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Đang là bản công khai
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}

          {row && row.moderationSignalCount > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              {row.moderationSignalCount} tín hiệu kiểm duyệt tự động được ghi nhận cho nội dung
              này. Tín hiệu chỉ là thông tin tham chiếu và không tự ẩn hay xoá nội dung.
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
