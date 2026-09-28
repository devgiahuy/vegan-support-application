'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Utensils, Target } from 'lucide-react';
import { AuthGuard } from '@/components/shared/auth-guard';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GenerateForm } from '@/features/meal-plan/components/generate-form';
import { PlanCard } from '@/features/meal-plan/components/plan-card';
import { useMealPlansQuery } from '@/features/meal-plan/queries/meal-plan.queries';

/**
 * Trang kế hoạch bữa ăn: form tạo thực đơn tuần + phiên bản gần nhất.
 * Yêu cầu đăng nhập (dữ liệu thuộc sở hữu từng người dùng).
 */
function MealPlansContent() {
  const { data, isLoading, isError, refetch } = useMealPlansQuery({ page: 1, limit: 5 });
  const plans = data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kế hoạch bữa ăn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tạo thực đơn chay 7 ngày theo mục tiêu, đúng luật ăn và hồ sơ sức khỏe của bạn.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Tạo thực đơn mới</CardTitle>
          </CardHeader>
          <CardContent>
            <GenerateForm recentPlans={plans} />
          </CardContent>
        </Card>

        <section className="space-y-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Phiên bản gần đây</h2>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="text-xs gap-1.5 h-8">
                <Link href="/custom-meals">
                  <Utensils className="h-3.5 w-3.5 text-primary" /> Món ăn của tôi
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs gap-1.5 h-8">
                <Link href="/meal-programs">
                  <Target className="h-3.5 w-3.5 text-primary" /> Lộ trình nhiều tuần
                </Link>
              </Button>
              {plans.length > 0 && (
                <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                  <Link href="/meal-plans/saved">
                    Xem tất cả
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {isLoading && <LoadingState message="Đang tải thực đơn..." />}
          {isError && (
            <ErrorState title="Không tải được thực đơn." onRetry={() => void refetch()} />
          )}
          {!isLoading && !isError && plans.length === 0 && (
            <EmptyState
              title="Chưa có thực đơn nào"
              description="Tạo thực đơn đầu tiên từ biểu mẫu bên cạnh — hệ thống sẽ tự cân đối 21 bữa theo mục tiêu của bạn."
            />
          )}
          {!isLoading && !isError && plans.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function MealPlansPage() {
  return (
    <AuthGuard>
      <MealPlansContent />
    </AuthGuard>
  );
}
