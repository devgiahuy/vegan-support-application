import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import type { Restaurant } from '../types/restaurant.model';
import { RestaurantCard } from './restaurant-card';

/**
 * Danh sách quán: đủ 4 trạng thái (FR-009), text chuẩn spec US-3, skeleton
 * chống CLS, empty trung thực. Khi lỗi mà còn kết quả cũ (VD quá tải —
 * T024) thì GIỮ danh sách + báo nhẹ, không thay bằng màn hình lỗi.
 */
export function RestaurantList({
  items,
  isLoading,
  isError,
  onRetry,
  externalNotice,
  selectedPlaceId,
  onSelectCard,
}: {
  items: Restaurant[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  externalNotice?: string | null;
  selectedPlaceId?: string | null;
  onSelectCard?: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-label="Đang tìm quán chay gần bạn">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (isError && items.length === 0) {
    return <ErrorState title="Không tải được quán gần đây, thử lại nhé." onRetry={onRetry} />;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy quán chay gần đây"
        description="Thử nới bán kính, đổi từ khóa hoặc địa chỉ khác."
      />
    );
  }
  return (
    <div className="space-y-3">
      {isError && (
        <p
          role="alert"
          className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/60 px-3 py-2 text-xs text-muted-foreground"
        >
          <span>Không tải được dữ liệu mới, đang hiện kết quả đã có.</span>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onRetry}>
            Thử lại
          </Button>
        </p>
      )}
      {externalNotice && (
        <p className="rounded-xl border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          {externalNotice}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            highlighted={restaurant.id === selectedPlaceId}
            onSelect={onSelectCard}
          />
        ))}
      </div>
    </div>
  );
}
