'use client';

import * as React from 'react';
import { Send, Loader2 } from 'lucide-react';
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
import { useSubmitPostMutation } from '../queries/review.queries';

interface SubmitReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle?: string;
  revisionId: string;
  expectedVersion: number;
  onSuccess?: () => void;
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
  const submitMutation = useSubmitPostMutation(postId);
  const isPending = submitMutation.isPending;

  React.useEffect(() => {
    if (open) {
      setNote('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionId) return;

    try {
      await submitMutation.mutateAsync({
        revisionId,
        expectedVersion,
        note: note.trim() || undefined,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Toast lỗi đã được xử lý trong onError của mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="gap-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 sm:mx-0">
            <Send className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-bold text-foreground">
              Gửi kiểm duyệt xuất bản
            </DialogTitle>
            <Badge variant="outline" className="text-xs font-mono font-medium">
              v{expectedVersion}
            </Badge>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Bạn đang chuẩn bị nộp bản nháp của{' '}
            <strong className="text-foreground font-semibold">
              &quot;{postTitle}&quot;
            </strong>{' '}
            lên hàng chờ kiểm duyệt. Quản trị viên sẽ thẩm định trước khi xuất bản
            công khai tới cộng đồng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="submit-note" className="text-sm font-semibold">
              Ghi chú cho kiểm duyệt viên{' '}
              <span className="text-xs font-normal text-muted-foreground">
                (tùy chọn)
              </span>
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

          <div className="rounded-xl border border-muted bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
            💡 <strong className="text-foreground">Lưu ý:</strong> Sau khi nộp,
            bản nháp này sẽ được khóa để đảm bảo tính bất biến trong quá trình
            Quản trị viên xem xét.
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
              className="rounded-xl gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Xác nhận gửi duyệt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
