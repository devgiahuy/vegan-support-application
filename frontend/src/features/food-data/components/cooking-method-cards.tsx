'use client';

import React from 'react';
import { ChefHat, Flame, Sparkles, Scale, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { useCookingMethodsQuery } from '../queries/food-data.queries';

interface CookingMethodCardsProps {
  className?: string;
}

export function CookingMethodCards({ className = '' }: CookingMethodCardsProps) {
  const { data, isLoading, isError, refetch } = useCookingMethodsQuery();

  if (isLoading) {
    return <LoadingState message="Đang tải danh mục phương pháp chế biến..." />;
  }

  if (isError) {
    return (
      <ErrorState title="Không thể tải phương pháp chế biến." onRetry={() => void refetch()} />
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="Chưa có dữ liệu phương pháp chế biến."
        description="Các phương pháp nấu nướng và hệ số bảo tồn dinh dưỡng đang được cập nhật."
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="cooking-method-cards">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((method) => (
          <div
            key={method.id || method.code}
            className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <ChefHat className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-foreground">{method.name}</h4>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {method.code}
                    </span>
                  </div>
                </div>
                {method.active ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-emerald-300 text-emerald-700 dark:text-emerald-300"
                  >
                    Đã kiểm định
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    Đang thử nghiệm
                  </Badge>
                )}
              </div>

              {method.description && (
                <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {method.description}
                </p>
              )}

              {/* Yield Factors */}
              {method.yieldFactors && method.yieldFactors.length > 0 && (
                <div className="mt-3 rounded-lg bg-muted/40 p-2.5 text-xs flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-amber-500" />
                    <span>Hệ số trọng lượng (Yield):</span>
                  </span>
                  <span className="font-bold font-mono text-foreground">
                    {method.yieldFactors[0].yieldPercent}%
                  </span>
                </div>
              )}

              {/* Retention Factors */}
              {method.retentionFactors && method.retentionFactors.length > 0 ? (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Hệ số bảo tồn dinh dưỡng (Retention):</span>
                  </p>
                  <div className="space-y-1.5">
                    {method.retentionFactors.map((rf) => (
                      <div key={rf.nutrientCode} className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-foreground">{rf.nutrientName}</span>
                          <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                            {rf.retentionPercent}%
                          </span>
                        </div>
                        <Progress value={rf.retentionPercent} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-[11px] text-muted-foreground italic border-t pt-2">
                  Đang phân tích hệ số bảo tồn vi chất...
                </div>
              )}
            </div>

            <div className="mt-4 pt-2 border-t border-muted/60 text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Cơ sở dữ liệu: USDA Nutrient Retention & Yield Guidelines</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
