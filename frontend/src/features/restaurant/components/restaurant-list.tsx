import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import type { Restaurant } from '../types/restaurant.model';
import { RestaurantCard } from './restaurant-card';

/** Danh sách quán: đủ 4 trạng thái, skeleton chống CLS, empty trung thực. */
export function RestaurantList({
  items,
  isLoading,
  isError,
  onRetry,
  externalNotice,
}: {
  items: Restaurant[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  externalNotice?: string | null;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-label="Đang tải quán">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <ErrorState title="Không tải được danh sách quán." onRetry={onRetry} />;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy quán phù hợp"
        description="Thử nới bán kính, đổi từ khóa hoặc địa chỉ khác."
      />
    );
  }
  return (
    <div className="space-y-3">
      {externalNotice && (
        <p className="rounded-xl border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          {externalNotice}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
}
