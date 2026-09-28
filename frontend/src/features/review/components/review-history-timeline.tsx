'use client';

import * as React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileEdit,
  User,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ContentReviewHistoryTimelineItem } from '../types/content-review.model';
import { PostReviewStatus } from '../types/content-review.model';

interface ReviewHistoryTimelineProps {
  revisions: ContentReviewHistoryTimelineItem[];
  emptyMessage?: string;
}

export function ReviewHistoryTimeline({
  revisions,
  emptyMessage = 'Chưa có lịch sử kiểm duyệt nào.',
}: ReviewHistoryTimelineProps) {
  if (!revisions || revisions.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {revisions.map((rev) => {
        const isApproved = rev.status === PostReviewStatus.PUBLISHED;
        const isRejected = rev.status === PostReviewStatus.REJECTED;
        const isPending = rev.status === PostReviewStatus.PENDING_REVIEW;

        return (
          <div key={rev.revisionId || rev.revisionVersion} className="relative group">
            {/* Điểm mốc trên dòng thời gian */}
            <div
              className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full border bg-background shadow-xs ${
                isApproved
                  ? 'border-emerald-500 text-emerald-600'
                  : isRejected
                  ? 'border-destructive text-destructive'
                  : isPending
                  ? 'border-amber-500 text-amber-500'
                  : 'border-muted-foreground text-muted-foreground'
              }`}
            >
              {isApproved && <CheckCircle2 className="h-3 w-3" />}
              {isRejected && <AlertCircle className="h-3 w-3" />}
              {isPending && <Clock className="h-3 w-3" />}
              {!isApproved && !isRejected && !isPending && (
                <FileEdit className="h-2.5 w-2.5" />
              )}
            </div>

            {/* Nội dung mốc thời gian */}
            <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2 shadow-xs transition-colors hover:border-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    Phiên bản v{rev.revisionVersion}
                  </span>
                  <Badge
                    variant={
                      isApproved
                        ? 'default'
                        : isRejected
                        ? 'destructive'
                        : isPending
                        ? 'secondary'
                        : 'outline'
                    }
                    className={`text-[10px] font-medium px-2 py-0 ${
                      isApproved
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : isPending
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : ''
                    }`}
                  >
                    {rev.statusLabel}
                  </Badge>
                  {rev.isCurrentPublished && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      Bản công khai hiện tại
                    </Badge>
                  )}
                </div>

                {rev.formattedSubmittedAt && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Nộp lúc: {rev.formattedSubmittedAt}</span>
                  </div>
                )}
              </div>

              {/* Ghi chú / Lý do phản hồi từ Admin */}
              {rev.reviewNote && (
                <div
                  className={`rounded-lg p-2.5 text-xs leading-relaxed ${
                    isRejected
                      ? 'bg-destructive/10 text-destructive dark:text-red-300 border border-destructive/20'
                      : 'bg-muted/50 text-foreground border border-muted'
                  }`}
                >
                  <p className="font-semibold mb-0.5">
                    {isRejected ? 'Lý do từ chối:' : 'Lời nhắn từ kiểm duyệt viên:'}
                  </p>
                  <p className="whitespace-pre-wrap">{rev.reviewNote}</p>
                </div>
              )}

              {/* Thông tin người kiểm duyệt và ngày giờ */}
              {rev.reviewedBy && rev.formattedReviewedAt && (
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" /> Thẩm định bởi: {rev.reviewedBy}
                  </span>
                  <span>•</span>
                  <span>Thời gian: {rev.formattedReviewedAt}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
