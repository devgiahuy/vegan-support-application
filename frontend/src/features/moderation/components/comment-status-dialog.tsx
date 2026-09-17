'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ModeratedComment } from '../types/moderation.model';
import { useUpdateCommentStatusMutation } from '../queries/moderation.queries';
import { commentStatusSchema, type CommentStatusFormValues } from '../schemas/moderation.schema';

/**
 * Dialog ẩn/khôi phục bình luận: status Select + lý do bắt buộc.
 * Mục tác giả đã xóa bị chặn từ bảng (không mở được dialog này).
 */
export function CommentStatusDialog({
  comment,
  open,
  onOpenChange,
}: {
  comment: ModeratedComment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateCommentStatusMutation();
  const form = useForm<CommentStatusFormValues>({
    resolver: zodResolver(commentStatusSchema),
    defaultValues: { status: 'HIDDEN', reason: '' },
  });
  const [status, setStatus] = React.useState<'VISIBLE' | 'HIDDEN'>('HIDDEN');

  const onSubmit = async (values: CommentStatusFormValues) => {
    if (!comment) return;
    try {
      await updateMutation.mutateAsync({
        id: comment.id,
        status: values.status,
        reason: values.reason,
      });
      form.reset();
      setStatus('HIDDEN');
      onOpenChange(false);
    } catch {
      // Lỗi đã toast ở query layer.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xử lý bình luận</DialogTitle>
          <DialogDescription>
            {comment
              ? `“${comment.content ?? '(không còn hiển thị)'}” — ${comment.authorName}.`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mod-comment-status">Trạng thái mới</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                const next = value as 'VISIBLE' | 'HIDDEN';
                setStatus(next);
                form.setValue('status', next, { shouldValidate: true });
              }}
            >
              <SelectTrigger id="mod-comment-status">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="HIDDEN">Ẩn bình luận</SelectItem>
                  <SelectItem value="VISIBLE">Khôi phục hiển thị</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-xs text-destructive">{form.formState.errors.status.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mod-comment-reason">Lý do (bắt buộc, lưu kiểm toán)</Label>
            <Textarea
              id="mod-comment-reason"
              rows={3}
              placeholder="Ghi rõ căn cứ xử lý..."
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || !comment}>
              {updateMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
