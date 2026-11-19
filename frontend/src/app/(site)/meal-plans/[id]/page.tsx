'use client';
import { DietaryPlanNotice } from '@/features/diet-preferences/components/dietary-plan-notice';

import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Droplets,
  Flame,
  Plus,
  Repeat,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  Utensils,
  Wheat,
  Apple,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AuthGuard } from '@/components/shared/auth-guard';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { getApiErrorStatus } from '@/lib/api-error';
import {
  useMealPlanDetailQuery,
  useManualAddMealItemMutation,
} from '@/features/meal-plan/queries/meal-plan.queries';
import { DayGrid, formatDayLabel } from '@/features/meal-plan/components/day-grid';
import { DietaryMealBadge } from '@/features/diet-preferences/components/dietary-meal-badge';
import { WarningsBanner } from '@/features/meal-plan/components/warnings-banner';
import { groupConstraintDetails } from '@/features/meal-plan/lib/constraint-details';
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

  const manualAddMutation = useManualAddMealItemMutation();

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
      sourceDetail: 'Mục tiêu được ước tính từ thông tin thể trạng và mục tiêu sức khỏe của bạn.',
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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-6">
      {/* Thanh điều hướng quay lại & Tạo mới */}
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="rounded-xl gap-1 text-muted-foreground hover:text-foreground"
        >
          <Link href="/meal-plans/saved">
            <ArrowLeft className="h-4 w-4" />
            Lịch sử thực đơn
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5 border-border/80 shadow-2xs"
        >
          <Link href="/meal-plans">
            <Plus className="h-4 w-4" />
            Tạo thực đơn mới
          </Link>
        </Button>
      </div>

      {isLoading && <LoadingState message="Đang tải chi tiết thực đơn..." />}
      {isError && <ErrorState title="Không tải được thực đơn." onRetry={() => void refetch()} />}

      {!isLoading && !isError && plan && (
        <>
          {/* 1. HERO HEADER: Tuần, Calo, Tỉ lệ lấp đầy, Badges & Nút thao tác */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 via-background to-teal-50/30 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20 p-6 sm:p-7 shadow-xs">
            {/* Hào quang trang trí nhẹ góc thẻ */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              {/* Bên trái: Overline + Tiêu đề + Chỉ số nhanh */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Kế hoạch thực đơn tuần
                  </span>
                  <Badge className="rounded-full bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40">
                    <Sparkles className="h-3 w-3 mr-1 text-emerald-600" />
                    {plan.goalLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full bg-background/60 text-muted-foreground border-border/70 text-xs"
                  >
                    Bản {plan.version}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full bg-background/60 text-muted-foreground border-border/70 text-xs"
                  >
                    Dinh dưỡng: {plan.nutritionDataQualityLabel.toLowerCase()}
                  </Badge>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Thực đơn tuần {plan.formattedWeekRange}
                </h1>

                {/* Thanh đo năng lượng & tiến độ bữa ăn */}
                <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-2xs backdrop-blur-xs">
                    <Flame className="h-4 w-4 text-orange-500 fill-orange-500/20" />
                    <span>
                      Mục tiêu{' '}
                      <strong className="font-bold text-foreground font-mono">
                        ~{plan.targetCalories.toLocaleString('vi-VN')}
                      </strong>{' '}
                      kcal/ngày
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-2xs backdrop-blur-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Tiến độ:{' '}
                      <strong className="font-bold text-emerald-600 dark:text-emerald-400">
                        {plan.filledSlots}/{plan.totalSlots}
                      </strong>{' '}
                      bữa đã lấp
                    </span>
                    {plan.filledSlots === plan.totalSlots && (
                      <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.2">
                        100%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bên phải: Nút thao tác quản lý */}
              <div className="flex items-center gap-2 self-start lg:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  className="rounded-xl border-border/70 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive text-muted-foreground text-xs h-9 px-3.5 shadow-2xs transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground group-hover:text-destructive" />
                  Xóa thực đơn
                </Button>
              </div>
            </div>
          </div>

          {/* 2. TÓM TẮT KẾ HOẠCH & BẢO TOÀN RÀNG BUỘC ĂN KIÊNG */}
          {plan.userSummary && (
            <div
              className={cn(
                'relative overflow-hidden rounded-xl border bg-white dark:bg-card px-3.5 py-3 shadow-2xs transition-all',
                !plan.userSummary.hardConstraintsPreserved
                  ? 'border-amber-300 dark:border-amber-800/60'
                  : 'border-emerald-200/80 dark:border-emerald-900/40'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5',
                      plan.userSummary.hardConstraintsPreserved
                        ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                    )}
                  >
                    {plan.userSummary.hardConstraintsPreserved ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                      {plan.userSummary.title || 'Tóm tắt kế hoạch thực đơn'}
                    </h3>
                    {plan.userSummary.hardViolations.length > 0 ? (
                      <ul className="mt-1 space-y-1 text-xs text-foreground/85 leading-relaxed">
                        {groupConstraintDetails(plan.userSummary.hardViolations).map((group) => (
                          <li key={JSON.stringify([group.name, group.details])}>
                            <span className="font-semibold">{group.name}</span>
                            {group.locations.length > 0 && (
                              <span> ({group.locations.join(', ')})</span>
                            )}
                            {': '}
                            {group.details.join('. ')}
                          </li>
                        ))}
                      </ul>
                    ) : plan.userSummary.detailLines.length > 1 ? (
                      <ul className="list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-muted-foreground">
                        {plan.userSummary.detailLines.map((line, index) => (
                          <li key={`${index}-${line}`} className="break-words">
                            {line}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-line text-xs text-muted-foreground leading-relaxed">
                        {plan.userSummary.detailLines.join('\n')}
                      </p>
                    )}
                  </div>
                </div>

                {plan.userSummary.hardConstraintsPreserved && (
                  <div className="inline-flex items-center gap-1 shrink-0 rounded-full border border-emerald-500/25 bg-emerald-50/80 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-2xs">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    Bảo toàn ràng buộc ăn kiêng
                  </div>
                )}
              </div>

              {plan.userSummary.suggestion && (
                <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-200/60 bg-amber-50/50 px-2.5 py-1 text-[11px] sm:text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="leading-snug">{plan.userSummary.suggestion}</span>
                </div>
              )}
            </div>
          )}

          {/* 3. BENTO 4 CHỈ SỐ DINH DƯỠNG MỖI NGÀY */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Utensils className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Mục tiêu 4 chỉ số dinh dưỡng mỗi ngày
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {dailyNutritionTargets.sourceDetail}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs text-muted-foreground shadow-2xs">
                <span>Dung sai cho phép:</span>
                <strong className="text-foreground font-semibold">
                  ±{dailyNutritionTargets.tolerancePercent}%
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {/* Đạm (Protein) */}
              <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-xs dark:border-emerald-800/50 dark:from-emerald-950/30 dark:via-emerald-950/15 dark:to-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <Sprout className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Đạm (Protein)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700/80 dark:text-emerald-400/80 bg-emerald-100/70 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded-md">
                    ~20% Calo
                  </span>
                </div>

                <div className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-emerald-950 dark:text-emerald-100 font-mono">
                  {dailyNutritionTargets.proteinGrams !== null
                    ? `~${dailyNutritionTargets.proteinGrams}g`
                    : '—'}
                </div>

                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950/60">
                  <div className="h-full w-full rounded-full bg-emerald-500 shadow-2xs" />
                </div>

                <p className="mt-2 text-[11px] text-emerald-800/70 dark:text-emerald-300/70">
                  Nuôi dưỡng cơ bắp & tế bào
                </p>
              </div>

              {/* Chất béo (Fat) */}
              <div className="group relative overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/80 via-sky-50/40 to-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-xs dark:border-sky-800/50 dark:from-sky-950/30 dark:via-sky-950/15 dark:to-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
                    <Droplets className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span>Chất béo (Fat)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-sky-700/80 dark:text-sky-400/80 bg-sky-100/70 dark:bg-sky-950/70 px-1.5 py-0.5 rounded-md">
                    ~30% Calo
                  </span>
                </div>

                <div className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-sky-950 dark:text-sky-100 font-mono">
                  {dailyNutritionTargets.fatGrams !== null
                    ? `~${dailyNutritionTargets.fatGrams}g`
                    : '—'}
                </div>

                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-sky-100 dark:bg-sky-950/60">
                  <div className="h-full w-full rounded-full bg-sky-500 shadow-2xs" />
                </div>

                <p className="mt-2 text-[11px] text-sky-800/70 dark:text-sky-300/70">
                  Chất béo thực vật lành mạnh
                </p>
              </div>

              {/* Chất xơ (Fiber) */}
              <div className="group relative overflow-hidden rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/80 via-purple-50/40 to-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-400 hover:shadow-xs dark:border-purple-800/50 dark:from-purple-950/30 dark:via-purple-950/15 dark:to-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 dark:text-purple-300">
                    <Apple className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>Chất xơ (Fiber)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-700/80 dark:text-purple-400/80 bg-purple-100/70 dark:bg-purple-950/70 px-1.5 py-0.5 rounded-md">
                    Chuẩn WHO
                  </span>
                </div>

                <div className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-purple-950 dark:text-purple-100 font-mono">
                  {dailyNutritionTargets.fiberGrams !== null
                    ? `~${dailyNutritionTargets.fiberGrams}g`
                    : '—'}
                </div>

                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-purple-100 dark:bg-purple-950/60">
                  <div className="h-full w-full rounded-full bg-purple-500 shadow-2xs" />
                </div>

                <p className="mt-2 text-[11px] text-purple-800/70 dark:text-purple-300/70">
                  Tối ưu hệ vi sinh đường ruột
                </p>
              </div>

              {/* Tinh bột (Carbs) */}
              <div className="group relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-amber-50/40 to-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-xs dark:border-amber-800/50 dark:from-amber-950/30 dark:via-amber-950/15 dark:to-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Wheat className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Tinh bột (Carbs)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700/80 dark:text-amber-400/80 bg-amber-100/70 dark:bg-amber-950/70 px-1.5 py-0.5 rounded-md">
                    ~50% Calo
                  </span>
                </div>

                <div className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-amber-950 dark:text-amber-100 font-mono">
                  {dailyNutritionTargets.carbohydrateGrams !== null
                    ? `~${dailyNutritionTargets.carbohydrateGrams}g`
                    : '—'}
                </div>

                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950/60">
                  <div className="h-full w-full rounded-full bg-amber-500 shadow-2xs" />
                </div>

                <p className="mt-2 text-[11px] text-amber-800/70 dark:text-amber-300/70">
                  Nguồn năng lượng bền vững
                </p>
              </div>
            </div>
          </div>

          {/* 4. BANNER CẢNH BÁO & LƯU Ý TỐI ƯU THỰC ĐƠN */}
          <DietaryPlanNotice compatibility={plan.compatibility} planIds={[plan.id]} />
          <WarningsBanner warnings={plan.warnings} warningDetails={plan.warningDetails} />

          {/* 5. LƯỚI LỊCH 7 NGÀY × 3 BỮA */}
          <DayGrid
            slotBadge={(slot) => (
              <DietaryMealBadge
                item={plan.compatibility?.items.find((item) => item.itemId === slot.id)}
              />
            )}
            shopping
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
