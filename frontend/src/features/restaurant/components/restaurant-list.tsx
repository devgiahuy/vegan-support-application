'use client';

import * as React from 'react';
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
  /** Nhãn và hành động gợi ý khi không có kết quả (FR-013). */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActions?: EmptyAction[];
}

const SKELETON_CARD_COUNT = 4;

/**
 * Danh sách quán chay với đủ bốn trạng thái (FR-015) và đồng bộ selection hai chiều với bản đồ.
 *
 * Trạng thái rỗng KHÔNG tự gọi lại dữ liệu với bộ lọc nới lỏng — chỉ hiện nút hành động.
 */
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
  const notices = result?.notices ?? [];

  // Cuộn thẻ quán tương ứng vào tầm nhìn khi người dùng bấm marker trên bản đồ.
  React.useEffect(() => {
    if (!selectedId) return;
    const cardEl = document.getElementById(`restaurant-card-${selectedId}`);
    if (cardEl) cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  // Hiển thị skeleton khi đang tải hoặc khi chưa có dữ liệu phản hồi
  if (isLoading || (!result && !isError)) {
    return (
      <div className="grid grid-cols-1 gap-3" aria-label="Đang tải danh sách quán" aria-busy="true">
        {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
          <div
            key={index}
            className="flex h-[248px] flex-col justify-between rounded-2xl border bg-card p-4 shadow-xs"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 w-3/5 rounded-md" />
                <Skeleton className="size-14 shrink-0 rounded-lg" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <Skeleton className="h-4 w-4/5 rounded-md" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <div className="flex items-center justify-between border-t border-border/50 pt-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Không tải được danh sách quán chay (yêu cầu có thể đã hết thời gian chờ hoặc kết nối mạng không ổn định)."
        onRetry={onRetry}
      />
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="space-y-4">
        <ResultNotice notices={notices} />
        <EmptyState
          title={emptyTitle ?? 'Chưa tìm thấy quán chay quanh đây'}
          description={
            emptyDescription ?? 'Thử mở rộng bán kính tìm kiếm hoặc đổi sang khu vực khác.'
          }
        />
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
          {emptyActions.map((action) => (
            <Button key={action.label} variant="outline" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isFetching && (
        <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-50/60 py-1.5 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          <span className="size-1.5 animate-ping rounded-full bg-emerald-500" />
          Đang cập nhật danh sách quán...
        </div>
      )}
      <ResultNotice notices={notices} />
      <div className="grid grid-cols-1 gap-3" role="list">
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            isSelected={selectedId === restaurant.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
