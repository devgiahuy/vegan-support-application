'use client';

import * as React from 'react';
import { Ban, Pencil, Settings2, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScheduleDatePicker } from './schedule-date-picker';
import { useSaveDietScheduleMutation } from '../queries/diet.queries';
import type { DietPreferenceSummary } from '@/features/profile/types/profile.model';
import { PracticeSchedule } from '@/common/enums';
import { getApiErrorCode } from '@/lib/api-error';

const SEVERITY_LABELS: Record<string, string> = {
  MILD: 'Nhẹ',
  MODERATE: 'Trung bình',
  SEVERE: 'Nặng',
};

function toShortDate(iso: string): string {
  const [, m, day] = iso.split('-');
  return `${day}/${m}`;
}

/**
 * Card tóm tắt chế độ ăn hiện tại. Với lịch chay kỳ, cho phép thêm/bớt ngày
 * ngay tại đây (lưu qua `PUT /users/me/diet-schedule`), không cần chạy lại wizard.
 * Hiển thị trực quan danh sách dị ứng & nguyên liệu kiêng đã lưu.
 * Hỗ trợ nút "Thay đổi chế độ ăn" để mở wizard chỉnh sửa/xóa/thêm khi cần.
 */
export function CurrentDietCard({
  summary,
  onChangeDiet,
}: {
  summary: DietPreferenceSummary;
  onChangeDiet?: () => void;
}) {
  const saveMutation = useSaveDietScheduleMutation();
  const [editing, setEditing] = React.useState(false);
  const [draftDates, setDraftDates] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const isPeriodic = summary.practiceSchedule === PracticeSchedule.PERIODIC;

  const openEditor = () => {
    setDraftDates([...summary.scheduleDates]);
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setError(null);
    try {
      await saveMutation.mutateAsync({ dates: draftDates });
      setEditing(false);
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'DIET_PREFERENCES_REQUIRED') {
        setError('Vui lòng lưu lựa chọn chế độ ăn trước khi lưu lịch.');
        return;
      }
      setError('Lưu lịch chay kỳ thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <Card className="border border-primary/20 bg-card shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Chế độ ăn hiện tại của bạn</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                Đang áp dụng
              </span>
            </div>
            <p className="mt-1.5 text-sm font-medium text-foreground/90">
              <span className="font-semibold text-primary">{summary.dietPatternLabel}</span> ·{' '}
              {summary.practiceScheduleLabel} · {summary.traditionLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPeriodic && !editing && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full text-xs"
                onClick={openEditor}
              >
                <Pencil className="h-3.5 w-3.5" /> Sửa ngày chay kỳ
              </Button>
            )}
            {!editing && onChangeDiet && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full text-xs border-primary/40 text-primary hover:bg-primary/5 cursor-pointer"
                onClick={onChangeDiet}
              >
                <Settings2 className="h-3.5 w-3.5" /> Thay đổi chế độ ăn
              </Button>
            )}
          </div>
        </div>

        {/* Khối Dị ứng & Nguyên liệu kiêng đã lưu */}
        <div className="grid gap-3 sm:grid-cols-2 pt-1">
          {/* Dị ứng */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs sm:text-sm space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Dị ứng ({summary.allergies?.length ?? 0}):</span>
            </div>
            {summary.allergies && summary.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {summary.allergies.map((a) => (
                  <span
                    key={a.allergenCode}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 border border-secondary-foreground/10 px-2.5 py-1 text-xs text-secondary-foreground"
                  >
                    <span className="font-medium">{a.label || a.allergenCode}</span>
                    {a.severity && (
                      <span className="text-[10px] text-muted-foreground bg-background/60 rounded px-1.5 py-0.5">
                        {SEVERITY_LABELS[a.severity] ?? a.severity}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Chưa có dị ứng nào được lưu.</p>
            )}
          </div>

          {/* Nguyên liệu kiêng */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs sm:text-sm space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Ban className="h-4 w-4 text-destructive shrink-0" />
              <span>Nguyên liệu kiêng ({summary.ingredientExclusions?.length ?? 0}):</span>
            </div>
            {summary.ingredientExclusions && summary.ingredientExclusions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {summary.ingredientExclusions.map((e) => (
                  <span
                    key={e.ingredientName}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 border border-secondary-foreground/10 px-2.5 py-1 text-xs text-secondary-foreground"
                  >
                    <span className="font-medium">{e.ingredientName}</span>
                    {e.reason && (
                      <span className="text-[10px] text-muted-foreground bg-background/60 rounded px-1.5 py-0.5">
                        {e.reason}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Chưa có nguyên liệu kiêng nào được lưu.
              </p>
            )}
          </div>
        </div>

        {isPeriodic && !editing && (
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-xs sm:text-sm">
            <span className="font-semibold text-foreground">
              Ngày chay kỳ ({summary.scheduleDates.length}):
            </span>{' '}
            {summary.scheduleDates.length > 0 ? (
              <span className="text-muted-foreground">
                {summary.scheduleDates.map(toShortDate).join(', ')}
              </span>
            ) : (
              <span className="text-amber-600 font-medium">
                Chưa chọn ngày chay kỳ nào. Bấm nút &quot;Sửa ngày chay kỳ&quot; để thêm.
              </span>
            )}
          </div>
        )}

        {isPeriodic && editing && (
          <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
            <ScheduleDatePicker dates={draftDates} onChange={setDraftDates} />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-xl"
                disabled={saveMutation.isPending}
                onClick={() => void handleSave()}
              >
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu ngày chay kỳ'}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={saveMutation.isPending}
                onClick={() => {
                  setEditing(false);
                  setError(null);
                }}
              >
                Hủy
              </Button>
            </div>
          </div>
        )}

        {summary.requiresRuleReview && (
          <Alert variant="destructive" className="py-2.5">
            <AlertDescription className="text-xs">
              Bộ quy tắc đã thay đổi — vui lòng bấm &quot;Thay đổi chế độ ăn&quot; để xem lại và xác
              nhận.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
