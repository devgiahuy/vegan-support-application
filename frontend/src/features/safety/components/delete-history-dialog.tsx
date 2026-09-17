'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteBehaviorHistoryMutation } from '../queries/safety.queries';

/**
 * Dialog xác nhận xóa toàn bộ lịch sử hành vi: nêu rõ không khôi phục
 * và gợi ý tắt consent để dừng hẳn. Thành công thì gợi ý chuyển cold-start.
 */
export function DeleteHistoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteMutation = useDeleteBehaviorHistoryMutation();

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync();
      onOpenChange(false);
    } catch {
      // Lỗi đã toast ở query layer.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa toàn bộ lịch sử hành vi?</DialogTitle>
          <DialogDescription>
            Mọi bản ghi hành vi dùng để cá nhân hóa gợi ý sẽ bị xóa vĩnh viễn và không thể khôi
            phục. Gợi ý sẽ chuyển sang chế độ phổ biến. Muốn dừng hẳn, hãy tắt cá nhân hóa ở phần
            cài đặt.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
