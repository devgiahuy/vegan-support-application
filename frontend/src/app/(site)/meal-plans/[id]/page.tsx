'use client';

import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Flame, Plus, Repeat, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/shared/auth-guard';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { getApiErrorStatus } from '@/lib/api-error';
import {
  useMealPlanDetailQuery,
  useSwapMealItemMutation,
  useManualAddMealItemMutation,
} from '@/features/meal-plan/queries/meal-plan.queries';
import { DayGrid, formatDayLabel } from '@/features/meal-plan/components/day-grid';
import { ShoppingList } from '@/features/meal-plan/components/shopping-list';
import { WarningsBanner } from '@/features/meal-plan/components/warnings-banner';
import { SwapMealItemDialog } from '@/features/meal-plan/components/swap-dialog';
import { DeleteMealPlanDialog } from '@/features/meal-plan/components/delete-dialog';
import {
  MealPlanItemSelector,
  type SelectedMealItem,
} from '@/features/meal-plan/components/meal-plan-item-selector';
import type {
  EstimatedNutritionTargets,
  MealSlot,
} from '@/features/meal-plan/types/meal-plan.model';

/** Chi tiết 1 phiên bản thực đơn: 21 ô + đi chợ + cảnh báo dinh dưỡng. */
function MealPlanDetailContent({ id }: { id: string }) {
  const { data: plan, isLoading, isError, error, refetch } = useMealPlanDetailQuery(id);
  const [swapSlot, setSwapSlot] = React.useState<MealSlot | null>(null);
  const [selectorSlot, setSelectorSlot] = React.useState<MealSlot | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const swapMutation = useSwapMealItemMutation();
  const manualAddMutation = useManualAddMealItemMutation();

  // Danh sách các bữa ăn đã lên lịch dùng cho tính toán Đi chợ thông minh (Phase 22)
  const planMeals = React.useMemo(() => {
    if (!plan?.items) return [];
    return plan.items
      .filter((slot) => slot.filled && (slot.recipeId || slot.customMealId))
      .map((slot) => ({
        sourceType: slot.sourceType,
        recipeId: slot.recipeId,
        servings: slot.servings || 1,
      }));
  }, [plan?.items]);

  // Mục tiêu dinh dưỡng đa lượng hàng ngày: ưu tiên từ backend, fallback chuẩn theo calo TDEE (20% Đạm, 30% Béo, 50% Bột, 14g xơ/1000kcal)
  const dailyNutritionTargets: EstimatedNutritionTargets = React.useMemo(() => {
    if (plan?.estimatedNutritionTargets) {
      return plan.estimatedNutritionTargets;
    }
    const cal = plan?.targetCalories && plan.targetCalories > 0 ? plan.targetCalories : 2000;
    return {
      proteinGrams: Math.round(((cal * 0.2) / 4) * 100) / 100,
      fatGrams: Math.round(((cal * 0.3) / 9) * 100) / 100,
      carbohydrateGrams: Math.round(((cal * 0.5) / 4) * 100) / 100,
      fiberGrams: Math.round((cal / 1000) * 14 * 100) / 100,
      tolerancePercent: 15,
      estimated: true,
      source: 'FALLBACK_TDEE',
      sourceDetail:
        'Mục tiêu được ước tính từ thông tin sức khỏe và mục tiêu bạn đã chọn. Đây là khoảng tham khảo, không phải số đo chính xác.',
    };
  }, [plan?.estimatedNutritionTargets, plan?.targetCalories]);

  const handleManualSelect = async (item: SelectedMealItem) => {
    if (!plan || !selectorSlot) return;
    try {
      await manualAddMutation.mutateAsync({
        planId: plan.id,
        itemId: selectorSlot.id,
        body: {
          expectedVersion: plan.lockVersion,
          idempotencyKey: `manual-add-${selectorSlot.id}-${item.id}-${Date.now()}`,
          sourceType: item.sourceType,
          recipeId: item.sourceType === 'RECIPE' ? item.id : undefined,
          customMealId: item.sourceType === 'CUSTOM_MEAL' ? item.id : undefined,
          servings: item.servings,
        },
      });
    } catch {
      // Lỗi đã được xử lý bằng toast ở query layer
    }
  };

  if (isError && getApiErrorStatus(error) === 404) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 lg:px-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/meal-plans/saved">
            <ArrowLeft data-icon="inline-start" />
            Lịch sử thực đơn
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/meal-plans">
            <Plus data-icon="inline-start" />
            Tạo thực đơn mới
          </Link>
        </Button>
      </div>

      {isLoading && <LoadingState message="Đang tải chi tiết thực đơn..." />}
      {isError && <ErrorState title="Không tải được thực đơn." onRetry={() => void refetch()} />}

      {!isLoading && !isError && plan && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Thực đơn tuần {plan.formattedWeekRange}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <Flame className="size-4" />
                Mục tiêu ~{plan.targetCalories} kcal/ngày — {plan.filledSlots}/{plan.totalSlots} bữa
                đã lấp
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{plan.goalLabel}</Badge>
              <Badge variant="outline">Bản {plan.version}</Badge>
              <Badge variant="outline">
                Dinh dưỡng: {plan.nutritionDataQualityLabel.toLowerCase()}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 data-icon="inline-start" />
              Xóa thực đơn
            </Button>
          </div>

          {/* Banner tóm tắt kế hoạch người dùng (Phase 18) */}
          {plan.userSummary && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {plan.userSummary.title || 'Tóm tắt kế hoạch thực đơn'}
                </h3>
                {plan.userSummary.hardConstraintsPreserved && (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs"
                  >
                    ✓ Bảo toàn ràng buộc ăn kiêng
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{plan.userSummary.detail}</p>
              {plan.userSummary.suggestion && (
                <p className="text-xs text-muted-foreground italic">
                  💡 {plan.userSummary.suggestion}
                </p>
              )}
            </div>
          )}

          {/* Mục tiêu dinh dưỡng đa lượng TDEE */}
          <div className="rounded-xl border bg-card p-4 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">
                  Mục tiêu 4 chỉ số dinh dưỡng mỗi ngày
                </span>{' '}
                <span className="text-muted-foreground text-xs">
                  ({dailyNutritionTargets.sourceDetail})
                </span>
              </div>
              <Badge
                variant="outline"
                className="self-start sm:self-center shrink-0 text-[11px] font-normal border-border/80 bg-muted/20"
              >
                Dung sai cho phép: ±{dailyNutritionTargets.tolerancePercent}%
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {/* Đạm (Protein) */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-center transition-all hover:border-emerald-300 hover:shadow-xs dark:border-emerald-800/40 dark:bg-emerald-950/25 dark:hover:border-emerald-700">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <span className="size-2 rounded-full bg-emerald-500 shadow-xs" />
                  Đạm (Protein)
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold tracking-tight text-emerald-950 dark:text-emerald-100">
                  {dailyNutritionTargets.proteinGrams !== null
                    ? `~${dailyNutritionTargets.proteinGrams}g`
                    : '—'}
                </div>
              </div>

              {/* Chất béo (Fat) */}
              <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 p-3 text-center transition-all hover:border-sky-300 hover:shadow-xs dark:border-sky-800/40 dark:bg-sky-950/25 dark:hover:border-sky-700">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300">
                  <span className="size-2 rounded-full bg-sky-500 shadow-xs" />
                  Chất béo (Fat)
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold tracking-tight text-sky-950 dark:text-sky-100">
                  {dailyNutritionTargets.fatGrams !== null
                    ? `~${dailyNutritionTargets.fatGrams}g`
                    : '—'}
                </div>
              </div>

              {/* Chất xơ (Fiber) */}
              <div className="rounded-xl border border-purple-200/80 bg-purple-50/60 p-3 text-center transition-all hover:border-purple-300 hover:shadow-xs dark:border-purple-800/40 dark:bg-purple-950/25 dark:hover:border-purple-700">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-800 dark:text-purple-300">
                  <span className="size-2 rounded-full bg-purple-500 shadow-xs" />
                  Chất xơ (Fiber)
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold tracking-tight text-purple-950 dark:text-purple-100">
                  {dailyNutritionTargets.fiberGrams !== null
                    ? `~${dailyNutritionTargets.fiberGrams}g`
                    : '—'}
                </div>
              </div>

              {/* Tinh bột (Carbs) */}
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-center transition-all hover:border-amber-300 hover:shadow-xs dark:border-amber-800/40 dark:bg-amber-950/25 dark:hover:border-amber-700">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <span className="size-2 rounded-full bg-amber-500 shadow-xs" />
                  Tinh bột (Carbs)
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold tracking-tight text-amber-950 dark:text-amber-100">
                  {dailyNutritionTargets.carbohydrateGrams !== null
                    ? `~${dailyNutritionTargets.carbohydrateGrams}g`
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Banner cảnh báo phát sinh từ tạo thực đơn cơ bản */}
          <WarningsBanner warnings={plan.warnings} warningDetails={plan.warningDetails} />

          {/* Lưới lịch 7 ngày × 3 bữa: hiển thị Calo, Protein, Chất béo, Chất xơ từng ngày kèm cảnh báo vượt ngưỡng */}
          <DayGrid
            items={plan.items}
            days={plan.days}
            targetCalories={plan.targetCalories}
            nutritionTargets={dailyNutritionTargets}
            actions={(slot) => (
              <div className="flex items-center gap-1.5 pt-1">
                {slot.filled ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setSwapSlot(slot)}
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      Đổi món
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-2 gap-1 ml-auto text-primary hover:bg-primary/5"
                      onClick={() => setSelectorSlot(slot)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Chọn món
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs w-full gap-1 text-primary border-primary/30 hover:bg-primary/5 font-medium"
                    onClick={() => setSelectorSlot(slot)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm món vào ô này
                  </Button>
                )}
              </div>
            )}
          />

          <ShoppingList items={plan.shoppingList} planMeals={planMeals} />

          <p className="text-xs text-muted-foreground">
            {plan.vitaminB12Mcg !== null
              ? `Tổng vitamin B12 ước tính: ${plan.vitaminB12Mcg} mcg (chỉ tính từ món có dữ liệu).`
              : 'Chưa có dữ liệu vitamin B12 cho thực đơn này.'}
          </p>

          <SwapMealItemDialog
            planId={plan.id}
            slot={swapSlot}
            expectedVersion={plan.lockVersion}
            open={swapSlot !== null}
            onOpenChange={(open) => {
              if (!open) setSwapSlot(null);
            }}
          />

          <MealPlanItemSelector
            open={selectorSlot !== null}
            onOpenChange={(open) => {
              if (!open) setSelectorSlot(null);
            }}
            onSelect={handleManualSelect}
            dayLabel={selectorSlot ? formatDayLabel(selectorSlot.date) : undefined}
            mealTypeLabel={selectorSlot?.mealTypeLabel}
          />

          <DeleteMealPlanDialog
            planId={plan.id}
            weekLabel={plan.formattedWeekRange}
            expectedVersion={plan.lockVersion}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
        </>
      )}
    </div>
  );
}

export default function MealPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return (
    <AuthGuard>
      <MealPlanDetailContent id={id} />
    </AuthGuard>
  );
}
