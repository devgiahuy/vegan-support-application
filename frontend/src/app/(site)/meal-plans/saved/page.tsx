'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { AuthGuard } from '@/components/shared/auth-guard';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlanCard } from '@/features/meal-plan/components/plan-card';
import { useMealPlansQuery } from '@/features/meal-plan/queries/meal-plan.queries';

const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Lịch sử phiên bản thực đơn của current user.
 * Nhận `?weekStart=` để lọc theo tuần (sai định dạng → bỏ filter).
 */
function SavedMealPlansContent() {
  const searchParams = useSearchParams();
  const initialWeek = searchParams.get('weekStart');
  const [weekStart, setWeekStart] = React.useState(
    initialWeek && WEEK_RE.test(initialWeek) ? initialWeek : ''
  );
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isError, refetch } = useMealPlansQuery({
    page,
    limit: 9,
    ...(weekStart ? { weekStart } : {}),
  });
  const plans = data?.items ?? [];
  const totalPages = data?.metadata.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thực đơn đã lưu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mọi phiên bản bạn đã tạo — tạo lại không ghi đè bản cũ.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/meal-plans">
            <Plus data-icon="inline-start" />
            Tạo thực đơn mới
          </Link>
        </Button>
      </div>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          void refetch();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="saved-week-start">Lọc theo tuần (Thứ Hai)</Label>
          <Input
            id="saved-week-start"
            type="date"
            value={weekStart}
            onChange={(e) => {
              setWeekStart(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {weekStart && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setWeekStart('');
              setPage(1);
            }}
          >
            Xóa lọc
          </Button>
        )}
      </form>

      {isLoading && <LoadingState message="Đang tải lịch sử thực đơn..." />}
      {isError && (
        <ErrorState title="Không tải được lịch sử thực đơn." onRetry={() => void refetch()} />
      )}
      {!isLoading && !isError && plans.length === 0 && (
        <EmptyState
          title="Chưa có phiên bản nào"
          description={
            weekStart
              ? 'Tuần này chưa có thực đơn. Hãy xóa lọc hoặc tạo mới ở trang kế hoạch bữa ăn.'
              : 'Tạo thực đơn đầu tiên ở trang kế hoạch bữa ăn để bắt đầu.'
          }
        />
      )}
      {!isLoading && !isError && plans.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

export default function SavedMealPlansPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<LoadingState message="Đang tải lịch sử thực đơn..." />}>
        <SavedMealPlansContent />
      </Suspense>
    </AuthGuard>
  );
}
