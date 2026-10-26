import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';
import type { EstimatedTargets } from '../types/meal-plan.model';

/** Bảng màu 4 chỉ số dinh dưỡng — cùng tông với web (emerald / sky / purple / amber), có biến thể tối để chữ luôn đọc được. */
export const MACRO_TONES = {
  protein: {
    tile: 'border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/25',
    dot: 'bg-emerald-500',
    label: 'text-emerald-800 dark:text-emerald-300',
    value: 'text-emerald-950 dark:text-emerald-100',
    chip: 'border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/20',
    chipText: 'text-emerald-900 dark:text-emerald-200',
    chipMuted: 'text-emerald-900/60 dark:text-emerald-300/60',
  },
  fat: {
    tile: 'border-sky-200/80 bg-sky-50/60 dark:border-sky-800/40 dark:bg-sky-950/25',
    dot: 'bg-sky-500',
    label: 'text-sky-800 dark:text-sky-300',
    value: 'text-sky-950 dark:text-sky-100',
    chip: 'border-sky-200/60 bg-sky-50/60 dark:border-sky-800/40 dark:bg-sky-950/20',
    chipText: 'text-sky-900 dark:text-sky-200',
    chipMuted: 'text-sky-900/60 dark:text-sky-300/60',
  },
  fiber: {
    tile: 'border-purple-200/80 bg-purple-50/60 dark:border-purple-800/40 dark:bg-purple-950/25',
    dot: 'bg-purple-500',
    label: 'text-purple-800 dark:text-purple-300',
    value: 'text-purple-950 dark:text-purple-100',
    chip: 'border-purple-200/60 bg-purple-50/60 dark:border-purple-800/40 dark:bg-purple-950/20',
    chipText: 'text-purple-900 dark:text-purple-200',
    chipMuted: 'text-purple-900/60 dark:text-purple-300/60',
  },
  carbs: {
    tile: 'border-amber-200/80 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/25',
    dot: 'bg-amber-500',
    label: 'text-amber-800 dark:text-amber-300',
    value: 'text-amber-950 dark:text-amber-100',
    chip: 'border-amber-200/60 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/20',
    chipText: 'text-amber-900 dark:text-amber-200',
    chipMuted: 'text-amber-900/60 dark:text-amber-300/60',
  },
  calories: {
    tile: '',
    dot: '',
    label: '',
    value: '',
    chip: 'border-orange-200/60 bg-orange-50/60 dark:border-orange-800/40 dark:bg-orange-950/20',
    chipText: 'text-orange-900 dark:text-orange-200',
    chipMuted: 'text-orange-900/60 dark:text-orange-300/60',
  },
} as const;

function MacroTile({
  tone,
  label,
  grams,
}: {
  tone: (typeof MACRO_TONES)[keyof typeof MACRO_TONES];
  label: string;
  grams: number | null;
}) {
  return (
    <View className={cn('w-[48.5%] items-center rounded-xl border p-3', tone.tile)}>
      <View className="flex-row items-center gap-1.5">
        <View className={cn('h-2 w-2 rounded-full', tone.dot)} />
        <Text className={cn('text-xs font-semibold', tone.label)}>{label}</Text>
      </View>
      <Text className={cn('mt-1 text-lg font-bold', tone.value)}>{grams !== null ? `~${grams}g` : '—'}</Text>
    </View>
  );
}

/** Mục tiêu 4 chỉ số dinh dưỡng mỗi ngày (đạm, béo, xơ, tinh bột) kèm dung sai — đồng bộ khối "Mục tiêu 4 chỉ số" của web. */
export function PlanNutritionTargets({ targets }: { targets: EstimatedTargets }) {
  return (
    <View className="gap-3 rounded-xl border border-border bg-card p-4">
      <View className="gap-2">
        <Text className="text-xs leading-5 text-muted-foreground">
          <Text className="font-semibold text-foreground">Mục tiêu 4 chỉ số dinh dưỡng mỗi ngày </Text>
          {targets.sourceDetail
            ? `(${targets.sourceDetail})`
            : '(Mục tiêu được ước tính từ thông tin sức khỏe và mục tiêu bạn đã chọn. Đây là khoảng tham khảo, không phải số đo chính xác.)'}
        </Text>
        <View className="self-start rounded-full border border-border bg-muted/40 px-2.5 py-1">
          <Text className="text-[11px] text-foreground">Dung sai cho phép: ±{targets.tolerancePercent}%</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap justify-between gap-y-2.5">
        <MacroTile tone={MACRO_TONES.protein} label="Đạm (Protein)" grams={targets.proteinGrams} />
        <MacroTile tone={MACRO_TONES.fat} label="Chất béo (Fat)" grams={targets.fatGrams} />
        <MacroTile tone={MACRO_TONES.fiber} label="Chất xơ (Fiber)" grams={targets.fiberGrams} />
        <MacroTile tone={MACRO_TONES.carbs} label="Tinh bột (Carbs)" grams={targets.carbohydrateGrams} />
      </View>
    </View>
  );
}
