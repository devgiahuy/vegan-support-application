'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/shared/loading-state';
import {
  usePersonalizationConsentQuery,
  useSetPersonalizationMutation,
} from '../queries/recommendation.queries';

/**
 * Switch đồng ý cá nhân hóa (thật, qua `PUT /users/me/personalization`).
 * Gửi lại `consentVersion` từ GET; version cũ → sync lại và báo xác nhận.
 */
export function ConsentSwitch() {
  const { data: consent, isLoading, isError } = usePersonalizationConsentQuery();
  const setMutation = useSetPersonalizationMutation();

  if (isLoading) return <LoadingState message="Đang tải cài đặt..." />;
  if (isError || !consent) {
    return <p className="text-xs text-muted-foreground">Không tải được cài đặt gợi ý.</p>;
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <Label className="text-sm font-semibold text-foreground">
          Gợi ý món theo hành vi của bạn
        </Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cho phép dùng món bạn xem, lưu, đánh giá và chủ đề quan tâm để tinh chỉnh gợi ý. Khi tắt,
          bạn vẫn thấy gợi ý phổ biến. Phiên bản điều khoản: {consent.consentVersion || '—'}.
        </p>
      </div>
      <Switch
        checked={consent.enabled}
        disabled={setMutation.isPending}
        onCheckedChange={(val) => {
          if (!consent.consentVersion) return;
          setMutation.mutate({ enabled: val, consentVersion: consent.consentVersion });
        }}
        aria-label="Bật hoặc tắt gợi ý cá nhân hóa"
      />
    </div>
  );
}
