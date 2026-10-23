import * as React from 'react';
import { Text, View } from 'react-native';
import { CalendarDays, TriangleAlert } from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { computeDayNutrition } from '../utils/day-nutrition';
import type { EstimatedMacros, EstimatedTargets, MealSlot } from '../types/meal-plan.model';
import { MACRO_TONES } from './plan-nutrition-targets';

const OVER_CHIP = 'border-rose-500/40 bg-rose-500/15';
const OVER_TEXT = 'text-rose-600 dark:text-rose-400';

function NutritionChip({
  tone,
  label,
  value,
  target,
  over,
}: {
  tone: (typeof MACRO_TONES)[keyof typeof MACRO_TONES];
  label: string;
  value: string;
  target?: string;
  over?: boolean;
}) {
  return (
    <View className={cn('rounded-md border px-2 py-0.5', over ? OVER_CHIP : tone.chip)}>
      <Text className={cn('text-[11px]', over ? OVER_TEXT : tone.chipText, over ? 'font-semibold' : 'font-medium')}>
        {label}: <Text className="font-bold">{value}</Text>
        {target ? <Text className={cn('font-normal', over ? OVER_TEXT : tone.chipMuted)}> / {target}</Text> : null}
      </Text>
    </View>
  );
}

/**
 * Thẻ một ngày — đồng bộ `DayGrid` của web: tiêu đề ngày, các chip Calo/Đạm/Béo/Xơ/Bột kèm mục tiêu, cảnh báo khi vượt
 * mức khuyến nghị, rồi lần lượt các bữa (`children`).
 */
export function PlanDayCard({
  label,
  slots,
  estimatedTotals,
  targetCalories,
  targets,
  children,
}: {
  label: string;
  slots: MealSlot[];
  estimatedTotals: EstimatedMacros | null;
  targetCalories: number;
  targets: EstimatedTargets | null;
  children: React.ReactNode;
}) {
  const colors = useIconColors();
  const nutrition = computeDayNutrition(slots, estimatedTotals, targetCalories, targets);
  const hasWarning = nutrition.overWarnings.length > 0;

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <View className="gap-2.5 border-b border-border bg-muted/30 p-4">
        <View className="flex-row flex-wrap items-center gap-2">
          <CalendarDays size={16} color={colors.primary} />
          <Text className="text-base font-semibold text-foreground">{label}</Text>
          {hasWarning ? (
            <View className="flex-row items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5">
              <TriangleAlert size={11} color={colors.destructive} />
              <Text className={cn('text-[11px] font-medium', OVER_TEXT)}>Vượt chỉ số ({nutrition.overWarnings.length})</Text>
            </View>
          ) : null}
        </View>
        <View className="flex-row flex-wrap gap-1.5">
          <NutritionChip
            tone={MACRO_TONES.calories}
            label="Calo"
            value={String(nutrition.dayCalories)}
            target={targetCalories > 0 ? `~${targetCalories} kcal` : undefined}
            over={nutrition.isCalorieOver}
          />
          <NutritionChip
            tone={MACRO_TONES.protein}
            label="Đạm"
            value={`${nutrition.protein}g`}
            target={targets?.proteinGrams ? `~${targets.proteinGrams}g` : undefined}
            over={nutrition.isProteinOver}
          />
          <NutritionChip
            tone={MACRO_TONES.fat}
            label="Béo"
            value={`${nutrition.fat}g`}
            target={targets?.fatGrams ? `~${targets.fatGrams}g` : undefined}
            over={nutrition.isFatOver}
          />
          <NutritionChip
            tone={MACRO_TONES.fiber}
            label="Xơ"
            value={nutrition.fiber !== null ? `${nutrition.fiber}g` : '—'}
            target={targets?.fiberGrams ? `~${targets.fiberGrams}g` : undefined}
            over={nutrition.isFiberOver}
          />
          {nutrition.carbs > 0 ? (
            <NutritionChip tone={MACRO_TONES.carbs} label="Bột" value={`${nutrition.carbs}g`} />
          ) : null}
        </View>
      </View>

      {hasWarning ? (
        <View className="mx-4 mt-3 flex-row items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
          <TriangleAlert size={15} color={colors.destructive} />
          <View className="flex-1 gap-1">
            <Text className="text-xs font-semibold text-rose-700 dark:text-rose-200">
              Lưu ý: Chỉ số dinh dưỡng ngày vượt mức khuyến nghị
            </Text>
            {nutrition.overWarnings.map((warning) => (
              <Text key={warning} className={cn('text-xs leading-5', 'text-rose-700 dark:text-rose-300')}>
                • {warning}
              </Text>
            ))}
            <Text className="pt-0.5 text-[11px] leading-4 text-muted-foreground">
              Bạn có thể bấm &quot;Đổi món&quot; hoặc chọn món khác ở các bữa bên dưới để cân đối lại dinh dưỡng.
            </Text>
          </View>
        </View>
      ) : null}

      <View className="gap-3 p-4">{children}</View>
    </View>
  );
}
