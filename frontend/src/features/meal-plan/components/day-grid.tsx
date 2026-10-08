import * as React from 'react';
import { Calendar, UtensilsCrossed, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MealType } from '@/common/enums';
import type {
  DayEstimatedTotals,
  EstimatedNutritionTargets,
  MealPlanDay,
  MealSlot,
} from '../types/meal-plan.model';

export const MEAL_ORDER = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER] as const;

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'Sáng',
  [MealType.LUNCH]: 'Trưa',
  [MealType.DINNER]: 'Tối',
};

const WEEKDAY_NAMES = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
] as const;

export function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
}

/** Nhãn ngày từ `YYYY-MM-DD` (thứ + dd/mm), tính theo UTC để tránh lệch timezone. */
export function formatDayLabel(dateStr: string, fallbackDayOfWeek?: string): string {
  const clean = normalizeDate(dateStr);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean);
  if (!match) return fallbackDayOfWeek ? `${fallbackDayOfWeek}, ${clean}` : clean;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return clean;

  const weekday = fallbackDayOfWeek || WEEKDAY_NAMES[date.getUTCDay()];
  const formattedDayMonth = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  return `${weekday}, ${formattedDayMonth}`;
}

function createPlaceholderSlot(date: string, mealType: MealType): MealSlot {
  return {
    id: `placeholder-${date}-${mealType}`,
    date,
    mealType,
    mealTypeLabel: MEAL_TYPE_LABELS[mealType] ?? mealType,
    filled: false,
    unfilledReason: 'Chưa xếp được món phù hợp',
    unresolvedCode: null,
    recipeId: '',
    recipeTitle: '',
    sourceType: 'RECIPE',
    isCustomMeal: false,
    customMealId: null,
    customMealName: null,
    customMealCoverage: null,
    calories: 0,
    formattedCalories: '0 kcal',
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    servings: 1,
  };
}

const UNRESOLVED_LABELS: Record<string, string> = {
  UNFILLED_SLOT: 'Chưa xếp món',
  NO_HARD_COMPATIBLE_CANDIDATE: 'Không có món phù hợp bộ lọc',
  ALLERGY_VIOLATION: 'Trùng nguyên liệu dị ứng',
  DIET_PATTERN_MISMATCH: 'Không khớp chế độ ăn',
  EXCLUDED_INGREDIENT: 'Chứa nguyên liệu cần tránh',
  HARD_CONSTRAINT_BLOCKED: 'Bảo vệ yêu cầu ăn kiêng',
};

function SlotCard({
  slot,
  actions,
  badge,
}: {
  slot: MealSlot;
  actions?: (slot: MealSlot) => React.ReactNode;
  badge?: (slot: MealSlot) => React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col justify-between gap-2.5 rounded-xl border p-3.5 shadow-xs transition-all h-full ${
        slot.filled
          ? 'bg-card hover:border-border/80'
          : 'border-dashed bg-muted/15 hover:border-amber-500/40 hover:bg-muted/25'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-xs font-medium">
              {slot.mealTypeLabel}
            </Badge>
            {slot.isCustomMeal && (
              <Badge className="bg-primary/10 text-primary border-primary/25 text-[10px] px-1.5 py-0 font-medium">
                Món cá nhân
              </Badge>
            )}
            {badge?.(slot)}
          </div>
          {slot.filled && (
            <span className="text-xs font-semibold text-foreground">{slot.formattedCalories}</span>
          )}
        </div>
        {slot.filled ? (
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
              {slot.recipeTitle}
            </p>
            {slot.protein > 0 || slot.carbs > 0 || slot.fat > 0 || slot.fiber > 0 ? (
              <p className="text-xs text-muted-foreground">
                Đạm {slot.protein}g · Bột {slot.carbs}g · Béo {slot.fat}g
                {slot.fiber > 0 && ` · Xơ ${slot.fiber}g`}
                {slot.servings > 0 && ` · ${slot.servings} khẩu phần`}
              </p>
            ) : (
              slot.servings > 0 && (
                <p className="text-xs text-muted-foreground">
                  {slot.servings} khẩu phần{' '}
                  {slot.customMealCoverage ? `· ${slot.customMealCoverage}` : ''}
                </p>
              )
            )}
          </div>
        ) : (
          <div className="py-1.5 space-y-1.5">
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              {slot.unfilledReason || 'Chưa có món phù hợp với calo hoặc luật ăn bữa này.'}
            </p>
            {slot.unresolvedCode && (
              <Badge
                variant="outline"
                className="text-[10px] text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 font-normal"
              >
                {UNRESOLVED_LABELS[slot.unresolvedCode] ?? slot.unresolvedCode}
              </Badge>
            )}
          </div>
        )}
      </div>
      {actions?.(slot)}
    </div>
  );
}

export interface DayNutritionInfo {
  dayCalories: number;
  protein: number;
  fat: number;
  fiber: number | null;
  carbs: number;
  isCalorieOver: boolean;
  isProteinOver: boolean;
  isFatOver: boolean;
  isFiberOver: boolean;
  hasWarning: boolean;
  overWarnings: string[];
}

export function computeDayNutrition(
  slots: Record<MealType, MealSlot>,
  estimatedTotals?: DayEstimatedTotals | null,
  targetCalories?: number,
  nutritionTargets?: EstimatedNutritionTargets | null
): DayNutritionInfo {
  const slotList = Object.values(slots).filter((s) => s.filled);
  const dayCalories = slotList.reduce((sum, s) => sum + (s.calories || 0), 0);

  const slotProtein = slotList.reduce((sum, s) => sum + (s.protein || 0), 0);
  const slotFat = slotList.reduce((sum, s) => sum + (s.fat || 0), 0);
  const slotCarbs = slotList.reduce((sum, s) => sum + (s.carbs || 0), 0);
  const slotFiber = slotList.reduce((sum, s) => sum + (s.fiber || 0), 0);

  const protein =
    estimatedTotals?.proteinGrams !== null && estimatedTotals?.proteinGrams !== undefined
      ? estimatedTotals.proteinGrams
      : slotProtein;

  const fat =
    estimatedTotals?.fatGrams !== null && estimatedTotals?.fatGrams !== undefined
      ? estimatedTotals.fatGrams
      : slotFat;

  const fiber =
    estimatedTotals?.fiberGrams !== null && estimatedTotals?.fiberGrams !== undefined
      ? estimatedTotals.fiberGrams
      : slotFiber > 0
        ? slotFiber
        : null;

  const carbs =
    estimatedTotals?.carbohydrateGrams !== null && estimatedTotals?.carbohydrateGrams !== undefined
      ? estimatedTotals.carbohydrateGrams
      : slotCarbs;

  const dailyCalTarget = targetCalories && targetCalories > 0 ? targetCalories : 2000;
  const tolerancePercent = nutritionTargets?.tolerancePercent ?? 20;

  const maxCal = Math.round(dailyCalTarget * (1 + tolerancePercent / 100));

  const targetProtein = nutritionTargets?.proteinGrams ?? Math.round((dailyCalTarget * 0.15) / 4);
  const maxProtein = Math.round(targetProtein * (1 + tolerancePercent / 100));

  const targetFat = nutritionTargets?.fatGrams ?? Math.round((dailyCalTarget * 0.25) / 9);
  const maxFat = Math.round(targetFat * (1 + tolerancePercent / 100));

  const targetFiber = nutritionTargets?.fiberGrams ?? Math.round((dailyCalTarget / 1000) * 14);
  const maxFiber = Math.round(targetFiber * (1 + tolerancePercent / 100));

  const overWarnings: string[] = [];

  const isCalorieOver = dayCalories > maxCal;
  if (isCalorieOver) {
    overWarnings.push(
      `Calo vượt ${dayCalories - maxCal} kcal (${dayCalories} / mục tiêu ~${dailyCalTarget} kcal, tối đa ~${maxCal} kcal)`
    );
  }

  const isProteinOver = targetProtein > 0 && protein > maxProtein;
  if (isProteinOver) {
    overWarnings.push(
      `Chất đạm (Protein) vượt ${(protein - maxProtein).toFixed(1)}g (${protein}g / mục tiêu ~${targetProtein}g, tối đa ~${maxProtein}g)`
    );
  }

  const isFatOver = targetFat > 0 && fat > maxFat;
  if (isFatOver) {
    overWarnings.push(
      `Chất béo (Fat) vượt ${(fat - maxFat).toFixed(1)}g (${fat}g / mục tiêu ~${targetFat}g, tối đa ~${maxFat}g)`
    );
  }

  const isFiberOver = targetFiber > 0 && fiber !== null && fiber > maxFiber;
  if (isFiberOver && fiber !== null) {
    overWarnings.push(
      `Chất xơ (Fiber) vượt ${(fiber - maxFiber).toFixed(1)}g (${fiber}g / khuyến nghị ~${targetFiber}g)`
    );
  }

  const hasWarning = overWarnings.length > 0;

  return {
    dayCalories,
    protein,
    fat,
    fiber,
    carbs,
    isCalorieOver,
    isProteinOver,
    isFatOver,
    isFiberOver,
    hasWarning,
    overWarnings,
  };
}

export interface DayGridProps {
  items?: MealSlot[];
  days?: MealPlanDay[];
  actions?: (slot: MealSlot) => React.ReactNode;
  slotBadge?: (slot: MealSlot) => React.ReactNode;
  targetCalories?: number;
  nutritionTargets?: EstimatedNutritionTargets | null;
}

interface DayGroup {
  date: string;
  dayOfWeekLabel: string;
  formattedLabel: string;
  estimatedTotals?: DayEstimatedTotals | null;
  slots: Record<MealType, MealSlot>;
  nutrition: DayNutritionInfo;
}

/** Lưới 7 ngày × 3 bữa. Nhóm theo `date` và `mealType`, hiển thị tổng calo, protein, fat, fiber kèm cảnh báo vượt ngưỡng. */
export function DayGrid({
  items,
  days,
  actions,
  slotBadge,
  targetCalories,
  nutritionTargets,
}: DayGridProps) {
  const dayGroups: DayGroup[] = React.useMemo(() => {
    // Ưu tiên 1: Sử dụng cấu trúc `days` 7 ngày từ endpoint
    if (days && days.length > 0) {
      return days.map((day) => {
        const cleanDate = normalizeDate(day.date);
        const slots: Record<MealType, MealSlot> = {
          [MealType.BREAKFAST]:
            day.slots.breakfast ??
            items?.find(
              (s) => normalizeDate(s.date) === cleanDate && s.mealType === MealType.BREAKFAST
            ) ??
            createPlaceholderSlot(cleanDate, MealType.BREAKFAST),
          [MealType.LUNCH]:
            day.slots.lunch ??
            items?.find(
              (s) => normalizeDate(s.date) === cleanDate && s.mealType === MealType.LUNCH
            ) ??
            createPlaceholderSlot(cleanDate, MealType.LUNCH),
          [MealType.DINNER]:
            day.slots.dinner ??
            items?.find(
              (s) => normalizeDate(s.date) === cleanDate && s.mealType === MealType.DINNER
            ) ??
            createPlaceholderSlot(cleanDate, MealType.DINNER),
        };

        const nutrition = computeDayNutrition(
          slots,
          day.estimatedTotals,
          targetCalories,
          nutritionTargets
        );

        return {
          date: cleanDate,
          dayOfWeekLabel: day.dayOfWeekLabel,
          formattedLabel: formatDayLabel(cleanDate, day.dayOfWeekLabel),
          estimatedTotals: day.estimatedTotals,
          slots,
          nutrition,
        };
      });
    }

    // Ưu tiên 2: Nhóm từ danh sách 21 slots `items` theo `date` và `mealType`
    if (items && items.length > 0) {
      const map = new Map<string, MealSlot[]>();
      for (const slot of items) {
        const cleanDate = normalizeDate(slot.date);
        if (!cleanDate) continue;
        const list = map.get(cleanDate) ?? [];
        list.push(slot);
        map.set(cleanDate, list);
      }

      return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dateSlots]) => {
          const slots: Record<MealType, MealSlot> = {
            [MealType.BREAKFAST]:
              dateSlots.find((s) => s.mealType === MealType.BREAKFAST) ??
              createPlaceholderSlot(date, MealType.BREAKFAST),
            [MealType.LUNCH]:
              dateSlots.find((s) => s.mealType === MealType.LUNCH) ??
              createPlaceholderSlot(date, MealType.LUNCH),
            [MealType.DINNER]:
              dateSlots.find((s) => s.mealType === MealType.DINNER) ??
              createPlaceholderSlot(date, MealType.DINNER),
          };

          const nutrition = computeDayNutrition(slots, null, targetCalories, nutritionTargets);

          return {
            date,
            dayOfWeekLabel: '',
            formattedLabel: formatDayLabel(date),
            estimatedTotals: null,
            slots,
            nutrition,
          };
        });
    }

    return [];
  }, [days, items, targetCalories, nutritionTargets]);

  if (dayGroups.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        <UtensilsCrossed className="size-4" />
        Thực đơn này chưa có bữa nào.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {dayGroups.map((day) => (
        <Card key={day.date} className="overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 bg-muted/20 border-b gap-2.5 space-y-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="size-4 text-primary" />
              <CardTitle className="text-base font-semibold">{day.formattedLabel}</CardTitle>
              {day.nutrition.hasWarning && (
                <Badge
                  variant="destructive"
                  className="text-[11px] gap-1 px-2 py-0.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                >
                  <AlertTriangle className="size-3" />
                  Vượt chỉ số ({day.nutrition.overWarnings.length})
                </Badge>
              )}
            </div>

            {/* 4 chỉ số dinh dưỡng + Total Calo trong ngày */}
            <div className="flex items-center gap-1.5 text-xs flex-wrap sm:justify-end">
              {/* Calo */}
              <span
                className={`rounded-md px-2 py-0.5 border text-[11px] font-medium transition-colors ${
                  day.nutrition.isCalorieOver
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 font-semibold'
                    : 'bg-orange-50/60 text-orange-900 border-orange-200/60 dark:bg-orange-950/20 dark:text-orange-200 dark:border-orange-800/40'
                }`}
                title="Tổng năng lượng các món trong ngày"
              >
                Calo: <strong>{day.nutrition.dayCalories}</strong>
                {targetCalories && targetCalories > 0 && (
                  <span className="text-orange-950/60 dark:text-orange-300/60 font-normal">
                    {' '}
                    / ~{targetCalories} kcal
                  </span>
                )}
              </span>

              {/* Đạm */}
              <span
                className={`rounded-md px-2 py-0.5 border text-[11px] font-medium transition-colors ${
                  day.nutrition.isProteinOver
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 font-semibold'
                    : 'bg-emerald-50/60 text-emerald-900 border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-200 dark:border-emerald-800/40'
                }`}
                title="Chất đạm trong ngày"
              >
                Đạm: <strong>{day.nutrition.protein}g</strong>
                {nutritionTargets?.proteinGrams && (
                  <span className="text-emerald-950/60 dark:text-emerald-300/60 font-normal">
                    {' '}
                    / ~{nutritionTargets.proteinGrams}g
                  </span>
                )}
              </span>

              {/* Chất béo */}
              <span
                className={`rounded-md px-2 py-0.5 border text-[11px] font-medium transition-colors ${
                  day.nutrition.isFatOver
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 font-semibold'
                    : 'bg-sky-50/60 text-sky-900 border-sky-200/60 dark:bg-sky-950/20 dark:text-sky-200 dark:border-sky-800/40'
                }`}
                title="Chất béo trong ngày"
              >
                Béo: <strong>{day.nutrition.fat}g</strong>
                {nutritionTargets?.fatGrams && (
                  <span className="text-sky-950/60 dark:text-sky-300/60 font-normal">
                    {' '}
                    / ~{nutritionTargets.fatGrams}g
                  </span>
                )}
              </span>

              {/* Chất xơ */}
              <span
                className={`rounded-md px-2 py-0.5 border text-[11px] font-medium transition-colors ${
                  day.nutrition.isFiberOver
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 font-semibold'
                    : 'bg-purple-50/60 text-purple-900 border-purple-200/60 dark:bg-purple-950/20 dark:text-purple-200 dark:border-purple-800/40'
                }`}
                title="Chất xơ trong ngày"
              >
                Xơ:{' '}
                <strong>{day.nutrition.fiber !== null ? `${day.nutrition.fiber}g` : '—'}</strong>
                {nutritionTargets?.fiberGrams && (
                  <span className="text-purple-950/60 dark:text-purple-300/60 font-normal">
                    {' '}
                    / ~{nutritionTargets.fiberGrams}g
                  </span>
                )}
              </span>

              {/* Tinh bột (Carbs) */}
              {day.nutrition.carbs > 0 && (
                <span className="rounded-md bg-amber-50/60 text-amber-900 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-200 dark:border-amber-800/40 px-2 py-0.5 border text-[11px] font-medium">
                  Bột: <strong>{day.nutrition.carbs}g</strong>
                </span>
              )}
            </div>
          </CardHeader>

          {/* Banner cảnh báo nếu có chỉ số vượt ngưỡng trong ngày */}
          {day.nutrition.hasWarning && (
            <div className="mx-4 mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="size-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-rose-800 dark:text-rose-200">
                  Lưu ý: Chỉ số dinh dưỡng ngày vượt mức khuyến nghị
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {day.nutrition.overWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted-foreground pt-0.5">
                  👉 Bạn có thể bấm <strong>"Đổi món"</strong> hoặc điều chỉnh khẩu phần ở các bữa
                  ăn bên dưới để cân đối lại dinh dưỡng.
                </p>
              </div>
            </div>
          )}

          <CardContent className="p-4 grid gap-3 sm:grid-cols-3">
            {MEAL_ORDER.map((mealType) => {
              const slot = day.slots[mealType];
              return (
                <SlotCard
                  key={slot.id || `${day.date}-${mealType}`}
                  slot={slot}
                  actions={actions}
                  badge={slotBadge}
                />
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
