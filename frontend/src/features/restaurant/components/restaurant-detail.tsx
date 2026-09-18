import Link from 'next/link';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { useRestaurantDetailQuery } from '../queries/restaurant.queries';

/** Chi tiết 1 quán: món/giờ/địa chỉ/nguồn + thời gian lấy. Chỉ nhận id. */
export function RestaurantDetail({ id }: { id: string }) {
  const { data: restaurant, isLoading, isError, refetch } = useRestaurantDetailQuery(id);

  if (isLoading) return <LoadingState message="Đang tải chi tiết quán..." />;
  if (isError || !restaurant || !restaurant.id) {
    return <ErrorState title="Không tìm thấy quán." onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link href="/restaurants">
          <ArrowLeft data-icon="inline-start" />
          Danh sách quán
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-xl">{restaurant.name}</CardTitle>
              <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  {restaurant.address}
                  {restaurant.distanceLabel && ` · ${restaurant.distanceLabel}`}
                </span>
              </p>
            </div>
            <Badge variant="secondary">{restaurant.sourceLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {restaurant.dishes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold">Món gợi ý</h3>
              <ul className="mt-1 grid gap-1.5 sm:grid-cols-2">
                {restaurant.dishes.map((dish) => (
                  <li key={dish} className="rounded-lg bg-muted/60 px-3 py-1.5 text-sm">
                    {dish}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="flex items-center gap-1.5 text-sm">
            <Clock className="size-4 text-muted-foreground" />
            {restaurant.openingHours ?? 'Giờ mở cửa chưa rõ'}
          </p>
          <p className="text-xs text-muted-foreground">
            Nguồn: {restaurant.sourceLabel}
            {restaurant.isStale && ' (dữ liệu có thể cũ, đang chờ cập nhật)'}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** Trạng thái trống khi id không hợp lệ (giữ để dùng chung). */
export function RestaurantDetailEmpty() {
  return <EmptyState title="Không tìm thấy quán" description="Quán có thể đã bị gỡ." />;
}
