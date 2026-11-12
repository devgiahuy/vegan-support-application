'use client';

import * as React from 'react';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import type { SubmitPostResult } from '../types/content-review.model';
import { useSubmitPostMutation } from '../queries/review.queries';

interface SubmitReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle?: string;
  revisionId: string;
  expectedVersion: number;
  onSuccess?: (result: SubmitPostResult) => void;
}

export function SubmitReviewDialog({
  open,
  onOpenChange,
  postId,
  postTitle = 'nội dung này',
  revisionId,
  expectedVersion,
  onSuccess,
}: SubmitReviewDialogProps) {
  const [note, setNote] = React.useState('');
  const user = useAuthStore((s) => s.user);
  const isContributor = user?.role === UserRole.CONTRIBUTOR;
  const submitMutation = useSubmitPostMutation(postId);
  const isPending = submitMutation.isPending;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNote('');
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionId) return;

    try {
      const result = await submitMutation.mutateAsync({
        revisionId,
        expectedVersion,
        note: isContributor ? undefined : note.trim() || undefined,
      });
      setNote('');
      onOpenChange(false);
      onSuccess?.(result);
    } catch {
      // Toast lỗi đã được xử lý trong onError của mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-x-hidden overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader className="gap-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 sm:mx-0">
            {isContributor ? <CheckCircle2 className="size-6" /> : <Send className="size-6" />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg font-bold text-balance text-foreground">
              {isContributor ? 'Xuất bản nội dung' : 'Gửi kiểm duyệt xuất bản'}
            </DialogTitle>
            <Badge variant="outline" className="text-xs font-mono font-medium">
              v{expectedVersion}
            </Badge>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-pretty text-muted-foreground">
            {isContributor ? (
              <>
                Bạn đang chuẩn bị xuất bản phiên bản của{' '}
                <strong className="font-semibold text-foreground">&quot;{postTitle}&quot;</strong>.
                Với vai trò Người đóng góp, nội dung sẽ được tự động duyệt và hiển thị công khai
                ngay lập tức.
              </>
            ) : (
              <>
                Bạn đang chuẩn bị nộp bản nháp của{' '}
                <strong className="font-semibold text-foreground">&quot;{postTitle}&quot;</strong>{' '}
                lên hàng chờ kiểm duyệt. Quản trị viên sẽ thẩm định trước khi xuất bản công khai tới
                cộng đồng.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          {!isContributor && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="submit-note" className="text-sm font-semibold">
                Ghi chú cho kiểm duyệt viên{' '}
                <span className="text-xs font-normal text-muted-foreground">(tùy chọn)</span>
              </Label>
              <Textarea
                id="submit-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Đã cập nhật ảnh bìa chất lượng cao, bổ sung thêm định lượng gia vị..."
                className="resize-none rounded-xl"
                disabled={isPending}
                maxLength={500}
              />
            </div>
          )}

          <div className="rounded-xl border border-muted bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Lưu ý:</strong>{' '}
            {isContributor
              ? 'Nội dung sau khi xác nhận sẽ được cập nhật thành phiên bản công khai mới nhất cho bạn đọc.'
              : 'Sau khi nộp, bản nháp này sẽ được khóa để đảm bảo tính bất biến trong quá trình Quản trị viên xem xét.'}
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isPending || !revisionId}
              className="gap-2 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isContributor ? 'Xác nhận xuất bản' : 'Xác nhận gửi duyệt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
