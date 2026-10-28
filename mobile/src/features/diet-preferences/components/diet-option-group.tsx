import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CalendarDays, Church, Egg, Flower2, Infinity as InfinityIcon, Leaf, Scale, type LucideIcon } from 'lucide-react-native';

import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

export interface DietOption<T extends string> {
  value: T;
  label: string;
  hint: string;
  icon: LucideIcon;
}

// Nội dung và icon đồng bộ `frontend/src/features/diet-preferences/components/diet-selector.tsx`.
export const PATTERN_OPTIONS: DietOption<DietPattern>[] = [
  { value: DietPattern.VEGAN, label: 'Thuần chay', hint: 'Không thịt, cá, trứng, sữa và mật ong', icon: Leaf },
  { value: DietPattern.LACTO_OVO, label: 'Có trứng sữa', hint: 'Không thịt cá, vẫn dùng trứng và sữa', icon: Egg },
];

export const SCHEDULE_OPTIONS: DietOption<PracticeSchedule>[] = [
  { value: PracticeSchedule.PERMANENT, label: 'Trường chay', hint: 'Áp dụng cho mọi ngày', icon: InfinityIcon },
  { value: PracticeSchedule.PERIODIC, label: 'Chay kỳ', hint: 'Chỉ áp dụng vào những ngày bạn chọn', icon: CalendarDays },
];

export const TRADITION_OPTIONS: DietOption<Tradition>[] = [
  { value: Tradition.NONE, label: 'Không theo truyền thống', hint: 'Chỉ theo kiểu ăn đã chọn', icon: Scale },
  { value: Tradition.BUDDHIST, label: 'Phật giáo', hint: 'Có thể bật thêm quy tắc tránh ngũ vị tân', icon: Flower2 },
  { value: Tradition.CHRISTIAN, label: 'Kitô giáo', hint: 'Có thể bật thêm quy tắc giữ chay theo Kitô giáo', icon: Church },
];

function OptionCard({
  option,
  selected,
  onPress,
  className,
}: {
  option: DietOption<string>;
  selected: boolean;
  onPress: () => void;
  className?: string;
}) {
  const colors = useIconColors();
  const Icon = option.icon;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${option.label}. ${option.hint}`}
      onPress={onPress}
      className={cn('gap-3 rounded-xl border p-4', selected ? 'border-primary bg-primary/5' : 'border-border bg-card', className)}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="size-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon size={16} color={colors.primary} />
        </View>
        <View className={cn('size-4 items-center justify-center rounded-full border', selected ? 'border-primary' : 'border-input')}>
          {selected ? <View className="size-2 rounded-full bg-primary" /> : null}
        </View>
      </View>
      <View className="gap-0.5">
        <Text className="text-sm font-semibold text-foreground">{option.label}</Text>
        <Text className="text-xs leading-4 text-muted-foreground">{option.hint}</Text>
      </View>
    </Pressable>
  );
}

/** Một nhóm lựa chọn dạng thẻ có icon + nút chọn tròn (tương đương `OptionGroup` của web). */
export function DietOptionGroup<T extends string>({
  title,
  description,
  options,
  value,
  onChange,
  columns,
}: {
  title: string;
  description: string;
  options: DietOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  columns: 1 | 2;
}) {
  const rows: DietOption<T>[][] = [];
  for (let i = 0; i < options.length; i += columns) rows.push(options.slice(i, i + columns));
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        <Text className="text-sm text-muted-foreground">{description}</Text>
      </View>
      <View accessibilityRole="radiogroup" className="gap-3">
        {rows.map((row) => (
          <View key={row[0]!.value} className="flex-row gap-3">
            {row.map((option) => (
              <OptionCard key={option.value} option={option} selected={value === option.value} onPress={() => onChange(option.value)} className="flex-1" />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
