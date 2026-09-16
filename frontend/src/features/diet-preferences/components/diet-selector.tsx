'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';

const PATTERN_OPTIONS: Array<{ value: DietPattern; label: string; hint: string }> = [
  { value: DietPattern.VEGAN, label: 'Thuần chay', hint: 'Không thịt, cá, trứng, sữa' },
  {
    value: DietPattern.LACTO_OVO,
    label: 'Có trứng sữa',
    hint: 'Không thịt cá, dùng được trứng sữa',
  },
];

const SCHEDULE_OPTIONS: Array<{ value: PracticeSchedule; label: string; hint: string }> = [
  { value: PracticeSchedule.PERMANENT, label: 'Trường chay', hint: 'Áp dụng mọi ngày' },
  { value: PracticeSchedule.PERIODIC, label: 'Chay kỳ', hint: 'Áp dụng vào những ngày đã chọn' },
];

const TRADITION_OPTIONS: Array<{ value: Tradition; label: string; hint: string }> = [
  { value: Tradition.NONE, label: 'Không theo truyền thống', hint: 'Chỉ theo nhu cầu dinh dưỡng' },
  { value: Tradition.BUDDHIST, label: 'Phật giáo', hint: 'Áp dụng quy tắc chay Phật giáo' },
  { value: Tradition.CHRISTIAN, label: 'Kitô giáo', hint: 'Áp dụng quy tắc chay Kitô giáo' },
];

function OptionGroup<T extends string>({
  id,
  title,
  options,
  value,
  onChange,
}: {
  id: string;
  title: string;
  options: Array<{ value: T; label: string; hint: string }>;
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <RadioGroup
        value={value ?? ''}
        onValueChange={(v) => onChange(v as T)}
        className="grid gap-2 sm:grid-cols-2"
      >
        {options.map((o) => (
          <label
            key={o.value}
            htmlFor={`${id}-${o.value}`}
            className="flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 has-checked:border-primary has-checked:bg-primary/5"
          >
            <RadioGroupItem id={`${id}-${o.value}`} value={o.value} className="mt-0.5" />
            <span>
              <span className="block text-sm font-medium">{o.label}</span>
              <span className="block text-xs text-muted-foreground">{o.hint}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

export interface DietSelection {
  dietPattern?: string;
  practiceSchedule?: string;
  tradition?: string;
}

/**
 * Chọn bộ ba chế độ ăn. Nhận value + onChange (string để tương thích request DTO), không gọi API.
 */
export function DietSelector({
  value,
  onChange,
}: {
  value: DietSelection;
  onChange: (v: DietSelection) => void;
}) {
  return (
    <div className="space-y-4">
      <OptionGroup
        id="diet-pattern"
        title="Kiểu ăn"
        options={PATTERN_OPTIONS}
        value={value.dietPattern}
        onChange={(dietPattern) => onChange({ ...value, dietPattern })}
      />
      <OptionGroup
        id="diet-schedule"
        title="Lịch thực hành"
        options={SCHEDULE_OPTIONS}
        value={value.practiceSchedule}
        onChange={(practiceSchedule) => onChange({ ...value, practiceSchedule })}
      />
      <OptionGroup
        id="diet-tradition"
        title="Truyền thống"
        options={TRADITION_OPTIONS}
        value={value.tradition}
        onChange={(tradition) => onChange({ ...value, tradition })}
      />
    </div>
  );
}
