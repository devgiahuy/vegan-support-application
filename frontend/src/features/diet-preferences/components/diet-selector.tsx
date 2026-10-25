'use client';

import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  Church,
  Egg,
  Flower2,
  Infinity as InfinityIcon,
  Leaf,
  Scale,
} from 'lucide-react';
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';

interface DietOption<T extends string> {
  value: T;
  label: string;
  hint: string;
  icon: LucideIcon;
}

export const PATTERN_OPTIONS: Array<DietOption<DietPattern>> = [
  {
    value: DietPattern.VEGAN,
    label: 'Thuần chay',
    hint: 'Không thịt, cá, trứng, sữa và mật ong',
    icon: Leaf,
  },
  {
    value: DietPattern.LACTO_OVO,
    label: 'Có trứng sữa',
    hint: 'Không thịt cá, vẫn dùng trứng và sữa',
    icon: Egg,
  },
];

export const SCHEDULE_OPTIONS: Array<DietOption<PracticeSchedule>> = [
  {
    value: PracticeSchedule.PERMANENT,
    label: 'Trường chay',
    hint: 'Áp dụng cho mọi ngày',
    icon: InfinityIcon,
  },
  {
    value: PracticeSchedule.PERIODIC,
    label: 'Chay kỳ',
    hint: 'Chỉ áp dụng vào những ngày bạn chọn',
    icon: CalendarDays,
  },
];

export const TRADITION_OPTIONS: Array<DietOption<Tradition>> = [
  {
    value: Tradition.NONE,
    label: 'Không theo truyền thống',
    hint: 'Chỉ theo kiểu ăn đã chọn',
    icon: Scale,
  },
  {
    value: Tradition.BUDDHIST,
    label: 'Phật giáo',
    hint: 'Có thể bật thêm quy tắc tránh ngũ vị tân',
    icon: Flower2,
  },
  {
    value: Tradition.CHRISTIAN,
    label: 'Kitô giáo',
    hint: 'Có thể bật thêm quy tắc giữ chay theo Kitô giáo',
    icon: Church,
  },
];

export function optionLabel<T extends string>(options: Array<DietOption<T>>, value?: string) {
  return options.find((option) => option.value === value)?.label;
}

function OptionGroup<T extends string>({
  id,
  title,
  description,
  options,
  value,
  onChange,
  columns,
}: {
  id: string;
  title: string;
  description: string;
  options: Array<DietOption<T>>;
  value: T | undefined;
  onChange: (v: T) => void;
  columns: 2 | 3;
}) {
  return (
    <FieldSet>
      <FieldLegend>{title}</FieldLegend>
      <FieldDescription>{description}</FieldDescription>
      <RadioGroup
        value={value ?? ''}
        onValueChange={(v) => onChange(v as T)}
        className={columns === 3 ? 'grid gap-3 sm:grid-cols-3' : 'grid gap-3 sm:grid-cols-2'}
      >
        {options.map((o) => {
          const Icon = o.icon;
          return (
            <label
              key={o.value}
              htmlFor={`${id}-${o.value}`}
              className="relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon aria-hidden className="size-4" />
                </span>
                <RadioGroupItem id={`${id}-${o.value}`} value={o.value} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{o.label}</span>
                <span className="text-xs text-pretty text-muted-foreground">{o.hint}</span>
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </FieldSet>
  );
}

export interface DietSelection {
  dietPattern?: string;
  practiceSchedule?: string;
  tradition?: string;
}

/**
 * Chọn bộ ba chế độ ăn. Nhận value + onChange (string để tương thích request DTO), không gọi API.
 * `scheduleSlot` hiện ngay dưới lựa chọn lịch (vd bộ chọn ngày chay kỳ).
 */
export function DietSelector({
  value,
  onChange,
  scheduleSlot,
}: {
  value: DietSelection;
  onChange: (v: DietSelection) => void;
  scheduleSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      <OptionGroup
        id="diet-pattern"
        title="Bạn ăn chay theo kiểu nào?"
        description="Quyết định nhóm thực phẩm động vật bị loại khỏi gợi ý."
        options={PATTERN_OPTIONS}
        value={value.dietPattern as DietPattern | undefined}
        onChange={(dietPattern) => onChange({ ...value, dietPattern })}
        columns={2}
      />
      <div className="flex flex-col gap-4">
        <OptionGroup
          id="diet-schedule"
          title="Bạn ăn chay khi nào?"
          description="Chay kỳ chỉ lọc món vào những ngày bạn đánh dấu."
          options={SCHEDULE_OPTIONS}
          value={value.practiceSchedule as PracticeSchedule | undefined}
          onChange={(practiceSchedule) => onChange({ ...value, practiceSchedule })}
          columns={2}
        />
        {scheduleSlot}
      </div>
      <OptionGroup
        id="diet-tradition"
        title="Bạn có theo truyền thống nào không?"
        description="Truyền thống bổ sung các quy tắc riêng ngoài kiểu ăn."
        options={TRADITION_OPTIONS}
        value={value.tradition as Tradition | undefined}
        onChange={(tradition) => onChange({ ...value, tradition })}
        columns={3}
      />
    </div>
  );
}
