'use client';

import * as React from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteArticleMutation } from '../queries/post.queries';
import { usePostStore } from '@/store/usePostStore';

interface DeletePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle: string;
  /** Version optimistic-concurrency backend yêu cầu khi xóa (`?expectedVersion`). */
  expectedVersion?: number;
  onSuccess?: () => void;
}

export function DeletePostDialog({
  open,
  onOpenChange,
  postId,
  postTitle,
  expectedVersion,
  onSuccess,
}: DeletePostDialogProps) {
  const deleteMutation = useDeleteArticleMutation();
  const { deletePost } = usePostStore();

  const handleDelete = async () => {
    try {
      // Sync local store
      deletePost(postId);
      // Run mutation
      await deleteMutation.mutateAsync({ id: postId, expectedVersion });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="gap-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive sm:mx-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Xác nhận xoá bài viết?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Bạn có chắc chắn muốn xoá bài viết{' '}
            <strong className="text-foreground font-semibold">"{postTitle}"</strong> không?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 space-y-2 text-xs text-muted-foreground">
          <p className="font-semibold text-destructive flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Ảnh hưởng khi xoá bài viết:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Bài viết sẽ bị ẩn ngay lập tức khỏi trang cộng đồng và kết quả tìm kiếm.</li>
            <li>
              Các liên kết chia sẻ mạng xã hội hoặc mã QR trỏ tới bài viết này sẽ không còn xem
              được.
            </li>
            <li>
              Dữ liệu được lưu trữ an toàn (soft delete) và có thể yêu cầu khôi phục qua ban quản
              trị.
            </li>
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
            className="rounded-xl"
          >
            Huỷ bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-xl gap-2 font-semibold"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang xoá...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" /> Xác nhận xoá
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
