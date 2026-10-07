import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import type { Restaurant } from '../types/restaurant.model';
import { RestaurantCard } from './restaurant-card';

/**
 * Danh sách quán chay: đủ 4 trạng thái, skeleton chống CLS, đồng bộ selection 2 chiều với map.
 * Thiết kế dạng thẻ ngang tối ưu hiển thị bên cạnh bản đồ cố định (Split View).
 */
export function RestaurantList({
  items,
  isLoading,
  isError,
  selectedId,
  onSelect,
  onRetry,
  externalNotice,
}: {
  items: Restaurant[];
  isLoading: boolean;
  isError: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onRetry: () => void;
  externalNotice?: string | null;
}) {
  // Tự động cuộn thẻ quán tương ứng vào tầm nhìn khi marker trên bản đồ được click
  React.useEffect(() => {
    if (!selectedId) return;
    const cardEl = document.getElementById(`restaurant-card-${selectedId}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3" aria-label="Đang tải danh sách quán">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Không tải được danh sách quán." onRetry={onRetry} />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {externalNotice && (
          <Alert>
            <AlertDescription>{externalNotice}</AlertDescription>
          </Alert>
        )}
        <EmptyState
          title="Chưa có quán phù hợp trong kết quả"
          description="Thử mở rộng bán kính hoặc đổi từ khóa. Các ràng buộc ăn uống của bạn vẫn được áp dụng."
        />
        <Button variant="outline" onClick={onRetry}>
          Thử tìm lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {externalNotice && (
        <Alert>
          <AlertDescription>{externalNotice}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-3">
        {items.map((restaurant) => (
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
