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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Restaurant } from '../types/restaurant.model';
import { useReviewRestaurantMutation } from '../queries/restaurant.queries';

/**
 * Dialog duyệt/từ chối quán: quyết định + lý do bắt buộc.
 * Duyệt thì quán hiện công khai, từ chối thì loại (người gửi thấy lý do).
 */
export function ReviewRestaurantDialog({
  restaurant,
  open,
  onOpenChange,
}: {
  restaurant: Restaurant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reviewMutation = useReviewRestaurantMutation();
  const [decision, setDecision] = React.useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reason, setReason] = React.useState('');
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    if (!restaurant) return;
    if (reason.trim().length === 0) {
      setFieldError('Vui lòng nhập lý do.');
      return;
    }
    setFieldError(null);
    try {
      await reviewMutation.mutateAsync({ id: restaurant.id, decision, reason: reason.trim() });
      setReason('');
      setDecision('APPROVE');
      onOpenChange(false);
    } catch {
      // Lỗi đã toast ở query layer.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duyệt quán mới</DialogTitle>
          <DialogDescription>
            {restaurant ? `${restaurant.name} — ${restaurant.address}.` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2" role="group" aria-label="Quyết định">
          {(
            [
              { value: 'APPROVE', label: 'Duyệt' },
              { value: 'REJECT', label: 'Từ chối' },
            ] as const
          ).map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={decision === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDecision(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="restaurant-review-reason">Lý do (bắt buộc)</Label>
          <Textarea
            id="restaurant-review-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant={decision === 'REJECT' ? 'destructive' : 'default'}
            onClick={() => void handleConfirm()}
            disabled={reviewMutation.isPending || !restaurant}
          >
            {reviewMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
