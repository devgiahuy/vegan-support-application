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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Restaurant } from '../types/restaurant.model';
import { useReviewRestaurantMutation } from '../queries/restaurant.queries';

/**
 * Dialog xem xét và kiểm duyệt quán ăn (Admin Moderation):
 * - Quyết định: Phê duyệt (PUBLISHED) hoặc Từ chối (REJECTED).
 * - Bắt buộc nhập lý do (tối thiểu 3 ký tự) cho cả phê duyệt và từ chối để phục vụ kiểm toán.
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
    if (reason.trim().length < 3) {
      setFieldError('Vui lòng nhập lý do quyết định cụ thể (tối thiểu 3 ký tự).');
      return;
    }
    setFieldError(null);
    try {
      await reviewMutation.mutateAsync({
        id: restaurant.id,
        decision,
        reason: reason.trim() || undefined,
      });
      onOpenChange(false);
    } catch {
      // Lỗi đã được toast ở mutation hook.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kiểm duyệt đề xuất quán chay</DialogTitle>
          <DialogDescription>
            {restaurant ? `${restaurant.name} — ${restaurant.address}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Quyết định kiểm duyệt</Label>
            <RadioGroup
              value={decision}
              onValueChange={(val) => {
                setDecision(val as 'APPROVE' | 'REJECT');
                setFieldError(null);
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="APPROVE" id="decision-approve" />
                <Label
                  htmlFor="decision-approve"
                  className="cursor-pointer font-medium text-emerald-600"
                >
                  Phê duyệt (Công khai)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REJECT" id="decision-reject" />
                <Label
                  htmlFor="decision-reject"
                  className="cursor-pointer font-medium text-destructive"
                >
                  Từ chối
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="review-reason">Lý do kiểm duyệt *</Label>
            <Textarea
              id="review-reason"
              rows={3}
              placeholder={
                decision === 'REJECT'
                  ? 'VD: Quán đã đóng cửa, địa chỉ không có thật, hoặc quán có phục vụ món mặn...'
                  : 'Nhập lý do phê duyệt quán...'
              }
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (fieldError) setFieldError(null);
              }}
            />
            {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={reviewMutation.isPending}
            variant={decision === 'APPROVE' ? 'default' : 'destructive'}
          >
            {reviewMutation.isPending ? 'Đang xử lý...' : 'Xác nhận quyết định'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
