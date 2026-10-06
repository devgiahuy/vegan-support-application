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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3" aria-label="Đang tải danh sách quán" aria-busy="true">
        {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
          // Chiều cao skeleton khớp thẻ thật để không dịch layout khi tải xong (chống CLS).
          <Skeleton key={index} className="h-[248px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Không tải được danh sách quán." onRetry={onRetry} />;
  }

  if (restaurants.length === 0) {
    return (
      <div className="space-y-3">
        <EmptyState
          title={emptyTitle ?? 'Chưa tìm thấy quán chay quanh đây'}
          description={
            emptyDescription ?? 'Thử mở rộng bán kính tìm kiếm hoặc đổi sang khu vực khác.'
          }
        />
        {emptyActions.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {emptyActions.map((action) => (
              <Button key={action.label} variant="outline" size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
