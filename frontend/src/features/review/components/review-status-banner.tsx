'use client';

import * as React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileEdit,
  History,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UserRole } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import { PostReviewStatus, type SubmitPostResult } from '../types/content-review.model';
import { SubmitReviewDialog } from './submit-review-dialog';

interface ReviewStatusBannerProps {
  postId: string;
  postTitle?: string;
  postStatus?: PostReviewStatus | string;
  revisionId?: string;
  revisionVersion?: number;
  publishedRevisionVersion?: number | null;
  isAuthor?: boolean;
  onOpenHistory?: () => void;
  onSuccess?: (result?: SubmitPostResult) => void;
  className?: string;
}

export function ReviewStatusBanner({
  postId,
  postTitle,
  postStatus = PostReviewStatus.DRAFT,
  revisionId,
  revisionVersion = 1,
  publishedRevisionVersion = null,
  isAuthor = true,
  onOpenHistory,
  onSuccess,
  className = '',
}: ReviewStatusBannerProps) {
  const [submitDialogOpen, setSubmitDialogOpen] = React.useState(false);
  const user = useAuthStore((s) => s.user);
  const isContributor = user?.role === UserRole.CONTRIBUTOR;

  const status = (
    Object.values(PostReviewStatus).includes(postStatus as PostReviewStatus)
      ? postStatus
      : PostReviewStatus.DRAFT
  ) as PostReviewStatus;

  // Nếu không phải tác giả và bài đã xuất bản, không cần hiển thị banner biên tập
  if (!isAuthor && status === PostReviewStatus.PUBLISHED) {
    return null;
  }

  const isDualRevision =
    publishedRevisionVersion !== null &&
    publishedRevisionVersion > 0 &&
    publishedRevisionVersion !== revisionVersion;
  const isFlaggedOrQuarantined =
    status === PostReviewStatus.FLAGGED || status === PostReviewStatus.QUARANTINED;

  return (
    <>
      <div
        className={cn(
          'rounded-2xl border p-4 transition-all duration-200 sm:p-5',
          status === PostReviewStatus.PENDING_REVIEW &&
            'border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-200',
          status === PostReviewStatus.REJECTED &&
            'border-destructive/30 bg-destructive/5 text-destructive dark:text-red-300',
          isFlaggedOrQuarantined &&
            'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200',
          status === PostReviewStatus.PUBLISHED &&
            'border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200',
          status !== PostReviewStatus.PENDING_REVIEW &&
            status !== PostReviewStatus.REJECTED &&
            !isFlaggedOrQuarantined &&
            status !== PostReviewStatus.PUBLISHED &&
            'border-border bg-card/60 text-foreground',
          className
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
                status === PostReviewStatus.PENDING_REVIEW &&
                  'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                status === PostReviewStatus.REJECTED && 'bg-destructive/10 text-destructive',
                isFlaggedOrQuarantined && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                status === PostReviewStatus.PUBLISHED &&
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                status !== PostReviewStatus.PENDING_REVIEW &&
                  status !== PostReviewStatus.REJECTED &&
                  !isFlaggedOrQuarantined &&
                  status !== PostReviewStatus.PUBLISHED &&
                  'bg-muted text-muted-foreground'
              )}
            >
              {status === PostReviewStatus.PENDING_REVIEW && <Clock className="size-5" />}
              {status === PostReviewStatus.REJECTED && <AlertCircle className="size-5" />}
              {isFlaggedOrQuarantined && <ShieldAlert className="size-5" />}
              {status === PostReviewStatus.PUBLISHED && <CheckCircle2 className="size-5" />}
              {status === PostReviewStatus.DRAFT && <FileEdit className="size-5" />}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold tracking-tight">
                  {status === PostReviewStatus.PENDING_REVIEW && 'Đang chờ kiểm duyệt'}
                  {status === PostReviewStatus.REJECTED && 'Bản nháp bị từ chối kiểm duyệt'}
                  {isFlaggedOrQuarantined && 'Nội dung cần rà soát thêm'}
                  {status === PostReviewStatus.PUBLISHED && 'Nội dung đã xuất bản'}
                  {status === PostReviewStatus.DRAFT && 'Bản nháp riêng tư'}
                </h4>
                <Badge variant="outline" className="rounded-full px-2 py-0.5 font-mono text-[11px]">
                  v{revisionVersion}
                </Badge>
                {isDualRevision && (
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-300"
                  >
                    Bản công khai: v{publishedRevisionVersion}
                  </Badge>
                )}
              </div>

              <p className="max-w-2xl text-xs leading-relaxed text-pretty text-muted-foreground">
                {status === PostReviewStatus.PENDING_REVIEW && (
                  <>
                    {isDualRevision
                      ? `Bản sửa đổi mới v${revisionVersion} đang được Quản trị viên thẩm định. Phiên bản công khai v${publishedRevisionVersion} vẫn hiển thị bình thường cho độc giả.`
                      : 'Bản nháp đã nộp thành công và đang chờ Quản trị viên thẩm định trước khi xuất bản.'}
                  </>
                )}
                {status === PostReviewStatus.REJECTED &&
                  'Bản nháp chưa đạt yêu cầu xuất bản. Vui lòng bấm "Xem lịch sử" để đọc lý do phản hồi của Quản trị viên và nộp lại sau khi chỉnh sửa.'}
                {isFlaggedOrQuarantined &&
                  'Nội dung có tín hiệu cần Ban biên tập xem xét trước khi hiển thị công khai.'}
                {status === PostReviewStatus.PUBLISHED &&
                  'Nội dung này hiện đang được hiển thị công khai cho bạn đọc trên toàn hệ thống.'}
                {status === PostReviewStatus.DRAFT && (
                  <>
                    {isDualRevision
                      ? isContributor
                        ? `Bạn đang biên tập bản sửa đổi mới v${revisionVersion}. Phiên bản công khai v${publishedRevisionVersion} vẫn hiển thị cho đến khi bạn xác nhận xuất bản.`
                        : `Bạn đang biên tập bản sửa đổi mới v${revisionVersion}. Phiên bản công khai v${publishedRevisionVersion} vẫn hiển thị bình thường cho độc giả.`
                      : isContributor
                        ? 'Nội dung này hiện chỉ có bạn nhìn thấy. Khi hoàn thành, hãy bấm "Xuất bản ngay" để đăng công khai.'
                        : 'Nội dung này hiện chỉ có bạn nhìn thấy. Khi hoàn thành, hãy bấm "Gửi kiểm duyệt" để xuất bản.'}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 self-end pt-2 sm:self-center sm:pt-0">
            {onOpenHistory && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenHistory}
                className="h-8 gap-1.5 rounded-xl text-xs"
              >
                <History className="size-3.5" />
                Lịch sử duyệt
              </Button>
            )}

            {isAuthor &&
              (status === PostReviewStatus.DRAFT || status === PostReviewStatus.REJECTED) &&
              revisionId && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setSubmitDialogOpen(true)}
                  className="h-8 gap-1.5 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Send className="size-3.5" />
                  {isContributor
                    ? status === PostReviewStatus.REJECTED
                      ? 'Xuất bản lại'
                      : 'Xuất bản ngay'
                    : status === PostReviewStatus.REJECTED
                      ? 'Gửi duyệt lại'
                      : 'Gửi kiểm duyệt'}
                </Button>
              )}
          </div>
        </div>
      </div>

      {revisionId && (
        <SubmitReviewDialog
          open={submitDialogOpen}
          onOpenChange={setSubmitDialogOpen}
          postId={postId}
          postTitle={postTitle}
          revisionId={revisionId}
          expectedVersion={revisionVersion}
          onSuccess={(result) => onSuccess?.(result)}
        />
      )}
    </>
  );
}
