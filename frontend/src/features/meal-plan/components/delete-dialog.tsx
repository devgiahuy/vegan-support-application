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
import { useDeleteMealPlanMutation } from '../queries/meal-plan.queries';

/**
 * Dialog xác nhận xóa 1 phiên bản thực đơn (soft-delete, idempotent).
 */
export function DeleteMealPlanDialog({
  planId,
  weekLabel,
  expectedVersion,
  open,
  onOpenChange,
}: {
  planId: string;
  weekLabel: string;
  expectedVersion: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteMutation = useDeleteMealPlanMutation();

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync({ id: planId, expectedVersion });
      onOpenChange(false);
    } catch {
      // Lỗi đã toast ở query layer (kể cả VERSION_CONFLICT kèm refetch).
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa thực đơn này?</DialogTitle>
          <DialogDescription>
            Thực đơn tuần {weekLabel} sẽ bị xóa khỏi lịch sử của bạn. Các phiên bản khác không bị
            ảnh hưởng.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
