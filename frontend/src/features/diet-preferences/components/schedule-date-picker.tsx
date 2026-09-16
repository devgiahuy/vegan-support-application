'use client';

import * as React from 'react';
import { CalendarPlus, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const SCHEDULE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function toDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Bộ chọn ngày dùng chung (controlled): wizard dùng để thu `scheduleDates` gửi kèm
 * preferences khi PERIODIC; `ScheduleEditor`/`CurrentDietCard` bọc thêm nút lưu riêng.
 */
export function ScheduleDatePicker({
  dates,
  onChange,
}: {
  dates: string[];
  onChange: (dates: string[]) => void;
}) {
  const [input, setInput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const add = () => {
    const v = input.trim();
    if (!SCHEDULE_DATE_RE.test(v)) {
      setError('Ngày phải đúng dạng YYYY-MM-DD (ví dụ: 2026-09-15).');
      return;
    }
    if (dates.includes(v)) {
      setError('Ngày này đã có trong danh sách.');
      return;
    }
    setError(null);
    onChange([...dates, v].sort());
    setInput('');
  };

  return (
    <div className="space-y-3">
      {dates.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {dates.map((d) => (
            <li
              key={d}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
            >
              {toDisplayDate(d)}
              <button
                type="button"
                aria-label={`Xóa ngày ${d}`}
                onClick={() => onChange(dates.filter((x) => x !== d))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Chưa chọn ngày nào. Thêm ngày bên dưới hoặc lưu trống để xóa hết lịch cũ.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="schedule-date">Thêm ngày (YYYY-MM-DD)</Label>
          <Input
            id="schedule-date"
            type="date"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <Button type="button" variant="outline" className="gap-1 rounded-xl" onClick={add}>
          <CalendarPlus className="h-4 w-4" /> Thêm ngày
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
