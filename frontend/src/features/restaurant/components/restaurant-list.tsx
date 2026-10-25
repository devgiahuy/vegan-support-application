'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import type { RestaurantDiscoveryResult } from '../types/restaurant.model';
import { RestaurantCard } from './restaurant-card';
import { ResultNotice } from './result-notice';

export interface EmptyAction {
  label: string;
  onClick: () => void;
}
export interface RestaurantListProps {
  result: RestaurantDiscoveryResult | undefined;
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onRetry: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActions?: EmptyAction[];
}

export function RestaurantList({
  result,
  isLoading,
  isFetching = false,
  isError,
  selectedId,
  onSelect,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyActions = [],
}: RestaurantListProps) {
  const restaurants = result?.restaurants ?? [];
  React.useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`restaurant-card-${selectedId}`)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [selectedId]);

  if (isLoading || (!result && !isError)) {
    return (
      <div className="flex flex-col gap-4" aria-label="Đang tải danh sách quán" aria-busy="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex gap-4 p-4 sm:p-5">
              <Skeleton className="aspect-square w-28 shrink-0 rounded-xl motion-reduce:animate-none sm:w-40" />
              <div className="flex flex-1 flex-col gap-3 py-1">
                <Skeleton className="h-3 w-20 motion-reduce:animate-none" />
                <Skeleton className="h-5 w-4/5 motion-reduce:animate-none" />
                <Skeleton className="h-4 w-1/2 motion-reduce:animate-none" />
                <Skeleton className="h-3 w-full motion-reduce:animate-none" />
                <Skeleton className="h-3 w-2/3 motion-reduce:animate-none" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-t p-4">
              <Skeleton className="h-4 w-1/3 motion-reduce:animate-none" />
              <Skeleton className="h-11 w-28 rounded-xl motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (isError)
    return (
      <div className="rounded-2xl border bg-muted/20 p-5">
        <ErrorState title="Chưa tải được danh sách quán. Vui lòng thử lại." onRetry={onRetry} />
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <ResultNotice notices={result?.notices ?? []} />
      {isFetching && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Đang cập nhật danh sách quán…
        </p>
      )}
      {restaurants.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-8">
          <EmptyState
            title={emptyTitle ?? 'Chưa tìm thấy quán chay quanh đây'}
            description={
              emptyDescription ?? 'Thử mở rộng bán kính tìm kiếm hoặc đổi sang khu vực khác.'
            }
          />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" className="h-11 rounded-xl" onClick={onRetry}>
              Thử lại
            </Button>
            {emptyActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-11 rounded-xl"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4" role="list" aria-label="Danh sách quán chay">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isSelected={selectedId === restaurant.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
