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
import { useMealPlanDetailQuery } from '@/features/meal-plan/queries/meal-plan.queries';
import { DayGrid } from '@/features/meal-plan/components/day-grid';
import { ShoppingList } from '@/features/meal-plan/components/shopping-list';
import { WarningsBanner } from '@/features/meal-plan/components/warnings-banner';
import { SwapMealItemDialog } from '@/features/meal-plan/components/swap-dialog';
import { DeleteMealPlanDialog } from '@/features/meal-plan/components/delete-dialog';
import type { MealSlot } from '@/features/meal-plan/types/meal-plan.model';

/** Chi tiết 1 phiên bản thực đơn: 21 ô + đi chợ + cảnh báo + dinh dưỡng. */
function MealPlanDetailContent({ id }: { id: string }) {
  const { data: plan, isLoading, isError, error, refetch } = useMealPlanDetailQuery(id);
  const [swapSlot, setSwapSlot] = React.useState<MealSlot | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

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

          <WarningsBanner warnings={plan.warnings} />

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
