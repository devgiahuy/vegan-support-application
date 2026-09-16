'use client';

import * as React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleDatePicker } from './schedule-date-picker';
import { useSaveDietScheduleMutation } from '../queries/diet.queries';
import { getApiErrorCode } from '@/lib/api-error';

/**
 * Chọn/lưu ngày chay kỳ (`YYYY-MM-DD`, gửi nguyên văn không convert timezone).
 * Cho phép lưu mảng rỗng (xóa hết ngày đã chọn). Chỉ dùng khi PERIODIC và đã
 * lưu preferences — parent (DietWizard) đảm bảo điều kiện này.
 */
export function ScheduleEditor({ initialDates }: { initialDates?: string[] }) {
  const saveMutation = useSaveDietScheduleMutation();
  const [dates, setDates] = React.useState<string[]>(initialDates ?? []);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    try {
      await saveMutation.mutateAsync({ dates });
      setSaved(true);
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'DIET_PREFERENCES_REQUIRED') {
        setError('Vui lòng lưu lựa chọn chế độ ăn trước khi lưu lịch.');
        return;
      }
      if (code === 'VALIDATION_ERROR') {
        setError('Danh sách ngày không hợp lệ. Chỉ nhận ngày dạng YYYY-MM-DD.');
        return;
      }
      setError('Lưu lịch chay kỳ thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ngày chay kỳ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScheduleDatePicker
          dates={dates}
          onChange={(next) => {
            setDates(next);
            setSaved(false);
          }}
        />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {saved && (
          <Alert>
            <AlertDescription>Đã lưu lịch chay kỳ ({dates.length} ngày).</AlertDescription>
          </Alert>
        )}

        <Button
          className="rounded-xl"
          disabled={saveMutation.isPending}
          onClick={() => void handleSave()}
        >
          {saveMutation.isPending ? 'Đang lưu...' : 'Lưu lịch chay kỳ'}
        </Button>
      </CardContent>
    </Card>
  );
}
