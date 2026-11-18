'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  Flame,
  Sprout,
  Droplets,
  Apple,
  Wheat,
  UtensilsCrossed,
  Utensils,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNutrient } from '../utils/nutrition.utils';
import type { MealItemSummary, ProgramWeek } from '../types/meal-program.model';
import { DietaryMealBadge } from '@/features/diet-preferences/components/dietary-meal-badge';
import type { DietaryImpactItem } from '@/features/diet-preferences/types/diet-impact.model';

interface WeekPlanViewProps {
  week: ProgramWeek;
  isDraft: boolean;
  onOpenRegenerateModal?: (weekNumber: number) => void;
  dietaryWarnings?: DietaryImpactItem[];
}

function MealThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [hasError, setHasError] = React.useState(false);
  if (!src || hasError) {
    return (
      <div className="w-12 h-12 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center shrink-0 text-muted-foreground/60">
        <UtensilsCrossed className="size-5" />
      </div>
    );
  }
  return (
    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted/20 border border-border/50">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="48px"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export const WeekPlanView: React.FC<WeekPlanViewProps> = ({
  week,
  isDraft,
  onOpenRegenerateModal,
  dietaryWarnings = [],
}) => {
  const snapshot = week.snapshot;

  if (!snapshot || !snapshot.days || snapshot.days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center space-y-3">
        <Utensils className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
        <p className="text-sm font-medium text-muted-foreground">
          Chưa có dữ liệu thực đơn cho tuần {week.weekNumber}.
        </p>
        {week.failureMessage && (
          <p className="text-sm text-muted-foreground">{week.failureMessage}</p>
        )}
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
      {/* 1. TỔNG QUAN DINH DƯỠNG TRONG TUẦN */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-card border shadow-2xs">
        {/* Năng lượng Calo */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Tổng calo tuần</span>
          </div>
          <p className="text-base font-bold text-foreground font-mono">
            ~{snapshot.totalCalories.toLocaleString('vi-VN')} kcal
          </p>
        </div>

        {/* Đạm (Protein) */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            <Sprout className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Đạm (Protein)</span>
          </div>
          <p className="text-base font-bold text-foreground font-mono">
            ~{formatNutrient(snapshot.macronutrients.protein)}g
          </p>
        </div>

        {/* Chất béo (Fat) */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-sky-800 dark:text-sky-300 font-medium">
            <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Chất béo (Fat)</span>
          </div>
          <p className="text-base font-bold text-foreground font-mono">
            ~{formatNutrient(snapshot.macronutrients.fat)}g
          </p>
        </div>

        {/* Chất xơ (Fiber) */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-purple-800 dark:text-purple-300 font-medium">
            <Apple className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Chất xơ (Fiber)</span>
          </div>
          <p className="text-base font-bold text-foreground font-mono">
            ~{formatNutrient(snapshot.macronutrients.fiber)}g
          </p>
        </div>

        {/* Tinh bột (Carbs) */}
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 font-medium">
            <Wheat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Tinh bột (Carbs)</span>
          </div>
          <p className="text-base font-bold text-foreground font-mono">
            ~{formatNutrient(snapshot.macronutrients.carbs)}g
          </p>
        </div>
      </div>

      {/* 2. DANH SÁCH CÁC THỨ NGÀY TRONG TUẦN (ÁP DỤNG LAYOUT VÀ STYLE TỪ /meal-plans/:id) */}
      <div className="flex flex-col gap-4">
        {snapshot.days.map((day) => {
          const dayTitle =
            day.formattedLabel ||
            (day.dayOfWeekLabel
              ? `${day.dayOfWeekLabel}, ${day.formattedDate || day.date}`
              : day.formattedDate || day.date);

          const hasMeals = day.meals && day.meals.length > 0;
          const nutrition = day.nutrition;

          return (
            <Card key={day.date || String(day.dayOfWeek)} className="overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 bg-muted/20 border-b gap-2.5 space-y-0">
                {/* Tiêu đề thứ ngày */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="size-4 text-primary" />
                  <CardTitle className="text-base font-semibold">{dayTitle}</CardTitle>
                </div>

                {/* 4 chỉ số dinh dưỡng + Total Calo trong ngày */}
                <div className="flex items-center gap-1.5 text-xs flex-wrap sm:justify-end">
                  {/* Calo */}
                  <span
                    className="rounded-md px-2 py-0.5 border text-[11px] font-medium transition-colors bg-orange-50/60 text-orange-900 border-orange-200/60 dark:bg-orange-950/20 dark:text-orange-200 dark:border-orange-800/40"
                    title="Tổng năng lượng trong ngày"
                  >
                    Calo: <strong>{day.totalCalories.toLocaleString('vi-VN')}</strong> kcal
                  </span>

                  {/* Đạm */}
                  {nutrition && nutrition.protein > 0 && (
                    <span
                      className="rounded-md px-2 py-0.5 border text-[11px] font-medium transition-colors bg-emerald-50/60 text-emerald-900 border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-200 dark:border-emerald-800/40"
                      title="Chất đạm trong ngày"
                    >
                      Đạm: <strong>{formatNutrient(nutrition.protein)}g</strong>
                    </span>
                  )}

                  {/* Béo */}
                  {nutrition && nutrition.fat > 0 && (
                    <span
                      className="rounded-md px-2 py-0.5 border text-[11px] font-medium transition-colors bg-sky-50/60 text-sky-900 border-sky-200/60 dark:bg-sky-950/20 dark:text-sky-200 dark:border-sky-800/40"
                      title="Chất béo trong ngày"
                    >
                      Béo: <strong>{formatNutrient(nutrition.fat)}g</strong>
                    </span>
                  )}

                  {/* Xơ */}
                  {nutrition && nutrition.fiber !== null && nutrition.fiber > 0 && (
                    <span
                      className="rounded-md px-2 py-0.5 border text-[11px] font-medium transition-colors bg-purple-50/60 text-purple-900 border-purple-200/60 dark:bg-purple-950/20 dark:text-purple-200 dark:border-purple-800/40"
                      title="Chất xơ trong ngày"
                    >
                      Xơ: <strong>{formatNutrient(nutrition.fiber)}g</strong>
                    </span>
                  )}

                  {/* Tinh bột (Carbs) */}
                  {nutrition && nutrition.carbs > 0 && (
                    <span
                      className="rounded-md bg-amber-50/60 text-amber-900 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-200 dark:border-amber-800/40 px-2 py-0.5 border text-[11px] font-medium"
                      title="Tinh bột trong ngày"
                    >
                      Bột: <strong>{formatNutrient(nutrition.carbs)}g</strong>
                    </span>
                  )}
                </div>
              </CardHeader>

              {/* Lưới các bữa ăn trong ngày (Sáng, Trưa, Tối, Phụ) */}
              <CardContent className="p-4 grid gap-3 sm:grid-cols-3">
                {!hasMeals ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-sm text-muted-foreground sm:col-span-3">
                    <UtensilsCrossed className="size-4" />
                    <span>Chưa xếp món cho ngày này</span>
                  </div>
                ) : (
                  day.meals.map((meal: MealItemSummary) => {
                    const hasMacros =
                      (meal.protein ?? 0) > 0 ||
                      (meal.carbs ?? 0) > 0 ||
                      (meal.fat ?? 0) > 0 ||
                      (meal.fiber ?? 0) > 0;

                    return (
                      <div
                        key={meal.id}
                        className="flex flex-col justify-between gap-2.5 rounded-xl border bg-card p-3.5 shadow-xs transition-all hover:border-border/80 h-full"
                      >
                        <div className="space-y-2">
                          {/* Dòng tiêu đề thẻ: Loại bữa + Nguồn + Trạng thái + Calo */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="text-xs font-medium">
                                {meal.mealTypeLabel}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 font-medium"
                              >
                                {meal.sourceTypeLabel}
                              </Badge>
                              {meal.isCompleted && (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] px-1.5 py-0 font-medium">
                                  Đã ăn ✓
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-foreground">
                              ~{meal.calories.toLocaleString('vi-VN')} kcal
                            </span>
                          </div>

                          {/* Nội dung: Ảnh thumbnail + Tên món + Dinh dưỡng */}
                          <div className="flex items-start gap-2.5">
                            <MealThumbnail src={meal.imageUrl} alt={meal.name} />
                            <div className="space-y-1 min-w-0 flex-1">
                              <p
                                className="text-sm font-semibold leading-snug text-foreground line-clamp-2"
                                title={meal.name}
                              >
                                {meal.name}
                                <DietaryMealBadge
                                  item={dietaryWarnings.find((item) => item.itemId === meal.id)}
                                />
                              </p>
                              {hasMacros ? (
                                <p className="text-xs text-muted-foreground">
                                  {meal.protein ? `Đạm ${formatNutrient(meal.protein)}g · ` : ''}
                                  {meal.carbs ? `Bột ${formatNutrient(meal.carbs)}g · ` : ''}
                                  {meal.fat ? `Béo ${formatNutrient(meal.fat)}g` : ''}
                                  {meal.fiber ? ` · Xơ ${formatNutrient(meal.fiber)}g` : ''}
                                  {meal.servings > 0 && ` · ${meal.servings} khẩu phần`}
                                </p>
                              ) : (
                                meal.servings > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    {meal.servings} khẩu phần
                                  </p>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Thao tác: Xem chi tiết công thức nếu có recipeId */}
                        {meal.recipeId && (
                          <div className="pt-1">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground w-full justify-start"
                            >
                              <Link href={`/recipes/${meal.recipeId}`} target="_blank">
                                <Utensils className="size-3.5" />
                                Xem công thức
                              </Link>
                            </Button>
                          </div>
                        )}
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
