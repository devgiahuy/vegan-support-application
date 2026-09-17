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
import type { AiFeatureToggle } from '../types/ai-governance.model';
import { useToggleAiFeatureMutation } from '../queries/ai-governance.queries';

/**
 * Dialog bật/tắt tính năng AI: lý do bắt buộc.
 * Sau đổi, user thường thấy trạng thái bảo trì thay vì lỗi.
 */
export function FeatureToggleDialog({
  feature,
  open,
  onOpenChange,
}: {
  feature: AiFeatureToggle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const toggleMutation = useToggleAiFeatureMutation();
  const [reason, setReason] = React.useState('');
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    if (!feature) return;
    if (reason.trim().length === 0) {
      setFieldError('Vui lòng nhập lý do bật/tắt.');
      return;
    }
    setFieldError(null);
    try {
      await toggleMutation.mutateAsync({
        feature: feature.feature,
        enabled: !feature.enabled,
        reason: reason.trim(),
      });
      setReason('');
      onOpenChange(false);
    } catch {
      // Lỗi đã toast ở query layer.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {feature?.enabled ? 'Tắt' : 'Bật'} tính năng {feature?.feature}
          </DialogTitle>
          <DialogDescription>
            {feature?.enabled
              ? 'Người dùng sẽ thấy trạng thái bảo trì thay vì lỗi.'
              : 'Tính năng sẽ hoạt động lại cho người dùng.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ai-toggle-reason">Lý do (bắt buộc)</Label>
          <Textarea
            id="ai-toggle-reason"
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
            variant={feature?.enabled ? 'destructive' : 'default'}
            onClick={() => void handleConfirm()}
            disabled={toggleMutation.isPending || !feature}
          >
            {toggleMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
