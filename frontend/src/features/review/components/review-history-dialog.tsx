'use client';

import * as React from 'react';
import { History, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useContentReviewHistoryQuery } from '../queries/review.queries';
import { ReviewHistoryTimeline } from './review-history-timeline';

interface ReviewHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle?: string;
}

export function ReviewHistoryDialog({
  open,
  onOpenChange,
  postId,
  postTitle,
}: ReviewHistoryDialogProps) {
  const { data, isLoading, isError, error } = useContentReviewHistoryQuery(
    postId,
    { page: 1, limit: 20 },
    open
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="gap-1.5 pb-2 border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <History className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Lịch sử kiểm duyệt
            </DialogTitle>
          </div>
          {postTitle && (
            <DialogDescription className="text-xs text-muted-foreground truncate">
              Bài viết: <span className="font-semibold text-foreground">{postTitle}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="overflow-y-auto pr-1 py-4 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Đang tải lịch sử kiểm duyệt...</span>
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-xs text-destructive">
              Không thể tải lịch sử kiểm duyệt:{' '}
              {error instanceof Error ? error.message : 'Lỗi không xác định'}
            </div>
          ) : (
            <ReviewHistoryTimeline revisions={data?.revisions || []} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
