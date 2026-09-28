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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AiFeatureToggle, AiToggleReason } from '../types/ai-governance.model';
import { useToggleAiFeatureMutation } from '../queries/ai-governance.queries';

const ALLOWED_REASONS: { value: AiToggleReason; label: string; desc: string }[] = [
  {
    value: 'PROVIDER_INCIDENT',
    label: 'Sự cố nhà cung cấp',
    desc: 'Nhà cung cấp AI gặp lỗi, mất kết nối hoặc phản hồi chậm bất thường',
  },
  {
    value: 'QUALITY_INVESTIGATION',
    label: 'Điều tra chất lượng',
    desc: 'Phát hiện câu trả lời hoặc kết quả nhận diện có dấu hiệu suy giảm chất lượng',
  },
  {
    value: 'SAFETY_HOLD',
    label: 'Tạm dừng vì an toàn',
    desc: 'Phát hiện rủi ro an toàn nội dung hoặc sai lệch hướng dẫn sức khỏe',
  },
  {
    value: 'PLANNED_MAINTENANCE',
    label: 'Bảo trì theo kế hoạch',
    desc: 'Bảo trì định kỳ hoặc nâng cấp hạ tầng mô hình AI',
  },
  {
    value: 'RESTORE_SERVICE',
    label: 'Khôi phục dịch vụ',
    desc: 'Khôi phục lại hoạt động bình thường sau khi xử lý xong sự cố/bảo trì',
  },
];

/**
 * Dialog bật/tắt tính năng AI: lý do bắt buộc chuẩn enum + chống xung đột phiên bản (409).
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
  const [reason, setReason] = React.useState<AiToggleReason | ''>('');
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setReason(feature?.enabled ? 'PLANNED_MAINTENANCE' : 'RESTORE_SERVICE');
      setFieldError(null);
    }
  }, [open, feature?.enabled]);

  const handleConfirm = async () => {
    if (!feature) return;
    if (!reason) {
      setFieldError('Vui lòng chọn lý do thay đổi trạng thái.');
      return;
    }
    setFieldError(null);

    try {
      await toggleMutation.mutateAsync({
        feature: feature.capability,
        enabled: !feature.enabled,
        provider: feature.provider,
        expectedVersion: feature.version,
        reason: reason as AiToggleReason,
      });
      onOpenChange(false);
    } catch {
      // Lỗi (bao gồm xung đột phiên bản 409) đã được toast xử lý ở query layer.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {feature?.enabled ? 'Tắt' : 'Bật'} tính năng {feature?.capabilityLabel}
          </DialogTitle>
          <DialogDescription>
            {feature?.enabled
              ? 'Tính năng sẽ chuyển sang chế độ dự phòng (' +
                feature.fallbackLabel +
                ') hoặc báo bảo trì.'
              : 'Tính năng sẽ hoạt động lại bình thường cho toàn bộ người dùng.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-toggle-reason">Lý do kiểm toán (Bắt buộc)</Label>
            <Select
              value={reason}
              onValueChange={(val) => {
                setReason(val as AiToggleReason);
                setFieldError(null);
              }}
            >
              <SelectTrigger id="ai-toggle-reason">
                <SelectValue placeholder="Chọn lý do thay đổi" />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">{r.label}</span>
                      <span className="text-[11px] text-muted-foreground">{r.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
          </div>

          <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Phiên bản hiện tại: </span>v
            {feature?.version ?? 1} (Kiểm soát đồng thời chống ghi đè ngoài ý muốn).
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={toggleMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            variant={feature?.enabled ? 'destructive' : 'default'}
            onClick={() => void handleConfirm()}
            disabled={toggleMutation.isPending || !feature}
          >
            {toggleMutation.isPending ? 'Đang áp dụng...' : 'Xác nhận thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
