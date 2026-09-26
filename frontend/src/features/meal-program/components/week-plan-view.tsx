'use client';

import React from 'react';
import Image from 'next/image';
import { Utensils, Flame, Sparkles, RefreshCw, Sun, Moon, Coffee, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MealItemSummary, ProgramWeek } from '../types/meal-program.model';

interface WeekPlanViewProps {
  week: ProgramWeek;
  isDraft: boolean;
  onOpenRegenerateModal?: (weekNumber: number) => void;
}

const MEAL_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    badgeStyle: string;
    icon: typeof Sun;
    iconColor: string;
  }
> = {
  BREAKFAST: {
    label: 'Bữa sáng',
    badgeStyle:
      'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    icon: Sun,
    iconColor: 'text-amber-500',
  },
  LUNCH: {
    label: 'Bữa trưa',
    badgeStyle:
      'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    icon: Utensils,
    iconColor: 'text-orange-500',
  },
  DINNER: {
    label: 'Bữa tối',
    badgeStyle:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    icon: Moon,
    iconColor: 'text-indigo-500',
  },
  SNACK: {
    label: 'Bữa phụ',
    badgeStyle:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    icon: Sparkles,
    iconColor: 'text-emerald-500',
  },
};

export const WeekPlanView: React.FC<WeekPlanViewProps> = ({
  week,
  isDraft,
  onOpenRegenerateModal,
}) => {
  const snapshot = week.snapshot;

  if (!snapshot || !snapshot.days || snapshot.days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center space-y-3">
        <Utensils className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
        <p className="text-sm font-medium text-muted-foreground">
          Chưa có dữ liệu thực đơn cho tuần {week.weekNumber}.
        </p>
        {isDraft && onOpenRegenerateModal && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenRegenerateModal(week.weekNumber)}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Sinh thực đơn cho tuần này
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thanh tóm tắt dinh dưỡng tuần */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-muted/40 border">
        <div className="space-y-0.5">
          <span className="text-xs text-muted-foreground">Tổng năng lượng</span>
          <p className="text-base font-bold text-foreground flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-500" />
            {snapshot.totalCalories.toLocaleString()} Kcal
          </p>
        </div>
        <div className="space-y-0.5">
          <span className="text-xs text-muted-foreground">Chất đạm (Protein)</span>
          <p className="text-base font-semibold text-foreground">
            {snapshot.macronutrients.protein}g
          </p>
        </div>
        <div className="space-y-0.5">
          <span className="text-xs text-muted-foreground">Tinh bột (Carbs)</span>
          <p className="text-base font-semibold text-foreground">
            {snapshot.macronutrients.carbs}g
          </p>
        </div>
        <div className="space-y-0.5">
          <span className="text-xs text-muted-foreground">Chất béo (Fat)</span>
          <p className="text-base font-semibold text-foreground">{snapshot.macronutrients.fat}g</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-xs text-muted-foreground">Chất xơ (Fiber)</span>
          <p className="text-base font-semibold text-foreground">
            {snapshot.macronutrients.fiber}g
          </p>
        </div>
      </div>

      {/* Danh sách 7 ngày trong tuần */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {snapshot.days.map((day) => {
          const dayTitle = day.dayOfWeekLabel
            ? `${day.dayOfWeekLabel} (${day.formattedDate || day.date})`
            : day.formattedDate || day.date;

          return (
            <Card
              key={day.date || String(day.dayOfWeek)}
              className="flex flex-col h-full border shadow-sm"
            >
              <CardHeader className="p-3.5 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-sm text-foreground">{dayTitle}</span>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium bg-background px-2 py-0.5 rounded-full border">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  {day.totalCalories} Kcal
                </span>
              </CardHeader>

              <CardContent className="p-3 space-y-2.5 flex-1">
                {day.meals.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">
                    Chưa xếp món cho ngày này
                  </p>
                ) : (
                  day.meals.map((meal: MealItemSummary) => {
                    const config = MEAL_TYPE_CONFIG[meal.mealType] ?? MEAL_TYPE_CONFIG.BREAKFAST;
                    const MealIcon = config.icon;

                    return (
                      <div
                        key={meal.id}
                        className="flex gap-2.5 p-2 rounded-lg bg-card border hover:border-primary/40 hover:shadow-sm transition-all"
                      >
                        {meal.imageUrl ? (
                          <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-muted">
                            <Image
                              src={meal.imageUrl}
                              alt={meal.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                            <MealIcon className={`w-5 h-5 ${config.iconColor}`} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${config.badgeStyle}`}
                            >
                              <MealIcon className="w-2.5 h-2.5 shrink-0" />
                              {meal.mealTypeLabel}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {meal.sourceTypeLabel}
                            </Badge>
                          </div>

                          <p
                            className="text-xs font-semibold text-foreground truncate"
                            title={meal.name}
                          >
                            {meal.name}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{meal.servings} khẩu phần</span>
                            <span className="font-medium text-foreground">
                              {meal.calories} Kcal
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
