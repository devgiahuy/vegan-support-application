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
} from '@/features/meal-plan/queries/meal-plan.queries';
import { DayGrid } from '@/features/meal-plan/components/day-grid';
import { ShoppingList } from '@/features/meal-plan/components/shopping-list';
import { WarningsBanner } from '@/features/meal-plan/components/warnings-banner';
import { SwapMealItemDialog } from '@/features/meal-plan/components/swap-dialog';
import { DeleteMealPlanDialog } from '@/features/meal-plan/components/delete-dialog';
import type { MealSlot } from '@/features/meal-plan/types/meal-plan.model';

import {
  MealAnalysisSummaryBar,
  MealAnalysisAlerts,
  MealAnalysisDetailDialog,
  MealAnalysisSwapDialog,
  MealAnalysisBadge,
  IncompleteDataBanner,
  useMealAnalysisQuery,
  useAnalyzeMealPlanMutation,
  type MealWarning,
  type SwapSuggestion,
} from '@/features/meal-analysis';

/** Chi tiết 1 phiên bản thực đơn: 21 ô + đi chợ + cảnh báo + dinh dưỡng + phân tích tương thích. */
function MealPlanDetailContent({ id }: { id: string }) {
  const { data: plan, isLoading, isError, error, refetch } = useMealPlanDetailQuery(id);
  const [swapSlot, setSwapSlot] = React.useState<MealSlot | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // States cho phân tích tương thích và vi chất (Phase 18)
  const [selectedDetailWarning, setSelectedDetailWarning] = React.useState<MealWarning | null>(
    null
  );
  const [selectedSwapWarning, setSelectedSwapWarning] = React.useState<MealWarning | null>(null);

  const { data: analysis } = useMealAnalysisQuery(plan?.id);
  const analyzeMutation = useAnalyzeMealPlanMutation(plan?.id ?? '', plan?.lockVersion);
  const swapMutation = useSwapMealItemMutation();

  // Bản đồ cảnh báo theo ô bữa ăn để hiển thị Badge trực quan trong DayGrid
  const warningsBySlotId = React.useMemo(() => {
    const map = new Map<string, MealWarning[]>();
    if (!analysis || analysis.isStale) return map;
    for (const warning of analysis.warnings) {
      for (const item of warning.affectedItems) {
        if (item.planItemId) {
          const list = map.get(item.planItemId) ?? [];
          list.push(warning);
          map.set(item.planItemId, list);
        }
      }
    }
    return map;
  }, [analysis]);

  const handleApplySwap = async (planItemId: string, swap: SwapSuggestion) => {
    if (!plan) return;
    await swapMutation.mutateAsync({
      planId: plan.id,
      itemId: planItemId,
      expectedVersion: plan.lockVersion,
      idempotencyKey: `swap-suggestion-${planItemId}-${swap.suggestedDishId}-${Date.now()}`,
    });
    // Kích hoạt phân tích lại sau khi đổi món thành công
    analyzeMutation.mutate();
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
                Mục tiêu {plan.targetCalories} kcal/ngày — {plan.filledSlots}/{plan.totalSlots} bữa
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

          {/* Banner cảnh báo phát sinh từ tạo thực đơn cơ bản */}
          <WarningsBanner warnings={plan.warnings} />

          {/* Module Phân tích Khẩu phần & Tương thích Dinh dưỡng (Phase 18) */}
          <MealAnalysisSummaryBar
            analysis={analysis}
            isLoading={analyzeMutation.isPending}
            onAnalyze={() => analyzeMutation.mutate()}
          />

          {analysis?.hasIncompleteData && (
            <IncompleteDataBanner
              confidence={analysis.overallConfidence}
              notes={analysis.incompleteDataNotes}
            />
          )}

          {analysis && !analysis.isStale && (
            <MealAnalysisAlerts
              warnings={analysis.warnings}
              onViewDetails={setSelectedDetailWarning}
              onViewSwaps={setSelectedSwapWarning}
            />
          )}

          {/* Lưới lịch tuần có nhúng Huy hiệu cảnh báo trên từng ô bữa ăn */}
          <DayGrid
            items={plan.items}
            actions={(slot) =>
              slot.filled ? (
                <Button variant="ghost" size="sm" onClick={() => setSwapSlot(slot)}>
                  <Repeat data-icon="inline-start" />
                  Đổi món
                </Button>
              ) : null
            }
            slotBadge={(slot) => {
              const warnings = warningsBySlotId.get(slot.id);
              if (!warnings || warnings.length === 0) return null;
              return (
                <MealAnalysisBadge
                  warnings={warnings}
                  onClick={(ws) => setSelectedDetailWarning(ws[0])}
                />
              );
            }}
          />

          <ShoppingList items={plan.shoppingList} />

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

          <DeleteMealPlanDialog
            planId={plan.id}
            weekLabel={plan.formattedWeekRange}
            expectedVersion={plan.lockVersion}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />

          {/* Hộp thoại xem chi tiết cơ sở khoa học & nguồn tài liệu */}
          <MealAnalysisDetailDialog
            warning={selectedDetailWarning}
            open={selectedDetailWarning !== null}
            onOpenChange={(open) => {
              if (!open) setSelectedDetailWarning(null);
            }}
          />

          {/* Hộp thoại gợi ý đổi món khắc phục cảnh báo */}
          <MealAnalysisSwapDialog
            warning={selectedSwapWarning}
            open={selectedSwapWarning !== null}
            onOpenChange={(open) => {
              if (!open) setSelectedSwapWarning(null);
            }}
            onSelectSwap={handleApplySwap}
            isSwapping={swapMutation.isPending}
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
