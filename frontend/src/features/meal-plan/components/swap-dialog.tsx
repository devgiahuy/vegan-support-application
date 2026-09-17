'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSwapMealItemMutation } from '../queries/meal-plan.queries';
import type { MealSlot } from '../types/meal-plan.model';
import { newIdempotencyKey } from '../utils/idempotency';

/**
 * Dialog đổi 1 ô món sang ứng viên an toàn (giữ luật ăn của đúng ngày).
 * Mỗi lần mở sinh `idempotencyKey` mới; retry cùng lần mở giữ nguyên key.
 */
export function SwapMealItemDialog({
  planId,
  slot,
  expectedVersion,
  open,
  onOpenChange,
}: {
  planId: string;
  slot: MealSlot | null;
  expectedVersion: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const swapMutation = useSwapMealItemMutation();
  const [idempotencyKey, setIdempotencyKey] = React.useState<string>(() => newIdempotencyKey());

  const handleOpenChange = (next: boolean) => {
    if (next) setIdempotencyKey(newIdempotencyKey());
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!slot) return;
    try {
      await swapMutation.mutateAsync({
        planId,
        itemId: slot.id,
        expectedVersion,
        idempotencyKey,
      });
      onOpenChange(false);
    } catch {
      // Lỗi đã toast ở query layer (kể cả VERSION_CONFLICT kèm refetch).
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi món này?</DialogTitle>
          <DialogDescription>
            {slot
              ? `${slot.mealTypeLabel} ngày ${slot.date}: “${slot.recipeTitle}” (${slot.formattedCalories}). Món thay thế vẫn tuân thủ dị ứng, nguyên liệu loại trừ và chế độ ăn của bạn.`
              : 'Chọn món thay thế vẫn tuân thủ luật ăn của bạn.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={swapMutation.isPending || !slot}>
            {swapMutation.isPending ? 'Đang đổi...' : 'Xác nhận đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
