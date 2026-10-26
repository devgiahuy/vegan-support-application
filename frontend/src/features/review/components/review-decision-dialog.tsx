'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
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
import { getApiErrorFields, getApiErrorMessage } from '@/lib/api-error';
import { useApprovePostMutation, useRejectPostMutation } from '../queries/review.queries';
import { reviewDecisionSchema, type ReviewDecisionValues } from '../schemas/review-decision.schema';
import { localizeReviewReasonError } from '../utils/review-error';

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

  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ReviewDecisionValues>({
    resolver: zodResolver(reviewDecisionSchema),
    defaultValues: { reason: '' },
  });

  const reasonLength = (watch('reason') || '').trim().length;

  React.useEffect(() => {
    if (open) {
      reset({ reason: '' });
      setServerError(null);
      clearErrors();
    }
  }, [open, reset, clearErrors]);

  const onSubmit = async (values: ReviewDecisionValues) => {
    setServerError(null);
    clearErrors();
    const reasonPayload = (values.reason || '').trim();

    try {
      if (isApprove) {
        await approveMutation.mutateAsync({ postId: targetId, reason: reasonPayload });
      } else {
        await rejectMutation.mutateAsync({ postId: targetId, reason: reasonPayload });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const fields = getApiErrorFields(err);
      let fieldErrorSet = false;

      if (fields?.reason) {
        const rawMsg = Array.isArray(fields.reason)
          ? fields.reason.map((m) => String(m)).join(', ')
          : String(fields.reason);
        const translatedReason = localizeReviewReasonError(rawMsg, isApprove);
        setError('reason', {
          type: 'server',
          message: translatedReason,
        });
        fieldErrorSet = true;
      }

      if (!fieldErrorSet) {
        const msg = getApiErrorMessage(err, 'Không thể hoàn tất quyết định kiểm duyệt.');
        setServerError(msg);
      }
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

        {serverError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="whitespace-pre-line leading-relaxed">{serverError}</span>
          </div>
        )}

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
                {isApprove ? 'Lý do duyệt' : 'Lý do từ chối *'}
              </Label>
              <span className="text-xs text-muted-foreground">
                {reasonLength}/{MAX_REASON_LENGTH}
                {!isApprove && ' (tối thiểu 10)'}
              </span>
            </div>
            <Textarea
              id="review-reason"
              rows={4}
              placeholder={
                isApprove
                  ? 'Ví dụ: Nguyên liệu thuần chay rõ ràng, định lượng đầy đủ... (hoặc để trống nếu duyệt nhanh)'
                  : 'Ví dụ: Thiếu định lượng nguyên liệu ở bước 2, ảnh bìa chưa rõ...'
              }
              className="resize-none"
              disabled={isPending}
              aria-invalid={Boolean(errors.reason)}
              {...register('reason', {
                onChange: () => {
                  if (serverError) setServerError(null);
                  if (errors.reason) clearErrors('reason');
                },
              })}
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
                disabled={isPending || (!isApprove && reasonLength < 10)}
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
