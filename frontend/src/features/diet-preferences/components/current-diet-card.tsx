'use client';

import * as React from 'react';
import { Pencil } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScheduleDatePicker } from './schedule-date-picker';
import { useSaveDietScheduleMutation } from '../queries/diet.queries';
import type { DietPreferenceSummary } from '@/features/profile/types/profile.model';
import { PracticeSchedule } from '@/common/enums';
import { getApiErrorCode } from '@/lib/api-error';

function toShortDate(iso: string): string {
  const [, m, day] = iso.split('-');
  return `${day}/${m}`;
}

/**
 * Card tóm tắt chế độ ăn hiện tại. Với lịch chay kỳ, cho phép thêm/bớt ngày
 * ngay tại đây (lưu qua `PUT /users/me/diet-schedule`), không cần chạy lại wizard.
 */
export function CurrentDietCard({ summary }: { summary: DietPreferenceSummary }) {
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
    <Card>
      <CardContent className="space-y-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold">Chế độ ăn hiện tại</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.dietPatternLabel} · {summary.practiceScheduleLabel} ·{' '}
              {summary.traditionLabel}
            </p>
          </div>
          {isPeriodic && !editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full"
              onClick={openEditor}
            >
              <Pencil className="h-3.5 w-3.5" /> Sửa ngày chay kỳ
            </Button>
          )}
        </div>

        {isPeriodic && !editing && (
          <p className="text-sm text-muted-foreground">
            {summary.scheduleDates.length > 0 ? (
              <>
                Ngày chay kỳ ({summary.scheduleDates.length}):{' '}
                {summary.scheduleDates.map(toShortDate).join(', ')}
              </>
            ) : (
              'Chưa chọn ngày chay kỳ nào.'
            )}
          </p>
        )}

        {isPeriodic && editing && (
          <div className="space-y-3 rounded-xl border p-4">
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
          <p className="text-sm text-amber-600">
            Bộ quy tắc đã thay đổi — vui lòng xem lại và xác nhận bên dưới.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
