import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { PantryItem } from '../types/pantry.model';
import { useDeletePantryItemMutation } from '../queries/pantry.queries';

interface PantryDeleteDialogProps {
  item: PantryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PantryDeleteDialog({ item, open, onOpenChange }: PantryDeleteDialogProps) {
  const deleteMutation = useDeletePantryItemMutation();

  const handleDelete = async () => {
    if (!item) return;
    await deleteMutation.mutateAsync({
      id: item.id,
      expectedVersion: item.version,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xóa nguyên liệu khỏi tủ bếp?</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa{' '}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              "{item?.displayName}"
            </span>{' '}
            khỏi tủ bếp? Dữ liệu sẽ được lưu trữ lịch sử kiểm toán trong hệ thống nhưng sẽ không còn
            xuất hiện trong danh sách tồn kho hiện hành.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa nguyên liệu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
