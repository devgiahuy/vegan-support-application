import * as React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import type { HealthProfile } from '../types/health.model';
import { formatDate } from '@/lib/utils';

/**
 * Khối kết quả sức khỏe: hiển thị đúng số backend trả (không tính lại).
 * `null` → empty state kèm CTA (parent truyền `onAdd`).
 */
export function HealthSummary({
  health,
  onAdd,
}: {
  health: HealthProfile | null;
  onAdd?: () => void;
}) {
  if (!health) {
    return (
      <EmptyState
        title="Chưa có dữ liệu sức khỏe."
        description="Nhập chiều cao, cân nặng, tuổi, giới tính và mức vận động để xem BMI, BMR và TDEE của bạn."
        action={
          onAdd ? (
            <Button variant="outline" size="sm" className="rounded-full" onClick={onAdd}>
              Nhập chỉ số ngay
            </Button>
          ) : undefined
        }
      />
    );
  }

  const stats = [
    { label: 'BMI', value: health.bmi.toFixed(2), note: health.bmiCategory },
    { label: 'BMR', value: health.bmr.toFixed(2), note: 'kcal/ngày' },
    { label: 'TDEE', value: health.tdee.toFixed(2), note: 'kcal/ngày' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kết quả sức khỏe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border bg-muted/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.note}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p>
            {health.heightCm} cm · {health.weightKg} kg · {health.age} tuổi · {health.sexLabel} ·{' '}
            {health.activityLevelLabel}
          </p>
          <p>Nguồn: nhập tay · Cập nhật: {formatDate(health.updatedAt)}</p>
        </div>

        {health.hasAbnormalBmi && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Chỉ số BMI của bạn nằm ngoài khoảng thông thường (12–45). Hãy kiểm tra lại số liệu đã
              nhập hoặc tham khảo ý kiến chuyên gia dinh dưỡng.
            </span>
          </div>
        )}

        {health.needsDisclaimer && (
          <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              Lưu ý: BMI của bạn thuộc nhóm cần quan tâm đặc biệt. Thực đơn sẽ kèm khuyến nghị phù
              hợp, không thay thế tư vấn y tế chuyên sâu.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
