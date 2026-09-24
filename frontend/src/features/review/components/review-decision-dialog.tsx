'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ReviewDecision } from '@/common/enums';
import { useApprovePostMutation, useRejectPostMutation } from '../queries/review.queries';
import { reviewDecisionSchema, type ReviewDecisionValues } from '../schemas/review-decision.schema';

interface ReviewDecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: ReviewDecision;
  postId: string;
  revisionId?: string;
  postTitle: string;
  /** false khi bài do chính user tạo hoặc backend báo không quyền quyết. */
  canDecide: boolean;
  onSuccess?: () => void;
}

const MAX_REASON_LENGTH = 1000;

export function ReviewDecisionDialog({
  open,
  onOpenChange,
  decision,
  postId,
  revisionId,
  postTitle,
  canDecide,
  onSuccess,
}: ReviewDecisionDialogProps) {
  const isApprove = decision === ReviewDecision.APPROVE;
  const targetId = revisionId || postId;
  const approveMutation = useApprovePostMutation();
  const rejectMutation = useRejectPostMutation();
  const isPending = approveMutation.isPending || rejectMutation.isPending;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewDecisionValues>({
    resolver: zodResolver(reviewDecisionSchema),
    defaultValues: { reason: '' },
  });

  const reasonLength = (watch('reason') || '').trim().length;

  React.useEffect(() => {
    if (open) reset({ reason: '' });
  }, [open, reset]);

  const onSubmit = async (values: ReviewDecisionValues) => {
    try {
      if (isApprove) {
        await approveMutation.mutateAsync({ postId: targetId, reason: values.reason });
      } else {
        await rejectMutation.mutateAsync({ postId: targetId, reason: values.reason });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Toast lỗi đã xử lý trong mutation onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="gap-2">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full sm:mx-0 ${
              isApprove
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {isApprove ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {isApprove ? 'Duyệt bài viết?' : 'Từ chối bài viết?'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {isApprove ? 'Bài viết ' : 'Bài viết '}
            <strong className="text-foreground font-semibold">&quot;{postTitle}&quot;</strong>
            {isApprove
              ? ' sẽ được xuất bản công khai ngay sau khi duyệt.'
              : ' sẽ chuyển về trạng thái từ chối kèm lý do để tác giả chỉnh sửa.'}
          </DialogDescription>
        </DialogHeader>

        {!canDecide ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Bạn không thể quyết định bài này (bài do chính bạn tạo hoặc bạn không có quyền duyệt).
              Vui lòng để người kiểm duyệt khác xử lý.
            </span>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-2" noValidate>
            <div className="flex items-center justify-between">
              <Label htmlFor="review-reason" className="font-semibold text-sm">
                Lý do {isApprove ? 'duyệt' : 'từ chối'} *
              </Label>
              <span className="text-xs text-muted-foreground">
                {reasonLength}/{MAX_REASON_LENGTH} (tối thiểu 10)
              </span>
            </div>
            <Textarea
              id="review-reason"
              rows={4}
              placeholder={
                isApprove
                  ? 'Ví dụ: Nguyên liệu thuần chay rõ ràng, định lượng đầy đủ...'
                  : 'Ví dụ: Thiếu định lượng nguyên liệu ở bước 2, ảnh bìa chưa rõ...'
              }
              className="resize-none"
              disabled={isPending}
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-xs font-medium text-destructive">{errors.reason.message}</p>
            )}
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="rounded-xl"
              >
                Huỷ bỏ
              </Button>
              <Button
                type="submit"
                variant={isApprove ? 'default' : 'destructive'}
                disabled={isPending || reasonLength < 10}
                className="rounded-xl gap-2 font-semibold"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isApprove ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
