import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { useRestaurantDetailQuery } from '../queries/restaurant.queries';

/**
 * Chi tiết 1 quán chay: Giờ mở cửa, thực đơn, liên hệ, xuất xứ dữ liệu & cảnh báo độ tươi.
 */
export function RestaurantDetail({ id }: { id: string }) {
  const { data: restaurant, isLoading, isError, refetch } = useRestaurantDetailQuery(id);

  if (isLoading) return <LoadingState message="Đang tải chi tiết quán chay..." />;
  if (isError || !restaurant || !restaurant.id) {
    return <ErrorState title="Không tìm thấy quán chay." onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/restaurants">
            <ArrowLeft data-icon="inline-start" />
            Danh sách quán
          </Link>
        </Button>
        {restaurant.lat && restaurant.lng && (
          <Button asChild variant="outline" size="sm">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-1"
            >
              Chỉ đường <ExternalLink className="size-3.5" />
            </a>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-2xl font-bold">{restaurant.name}</CardTitle>
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {restaurant.address}
                  {restaurant.distanceLabel && ` · Cách bạn ${restaurant.distanceLabel}`}
                </span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge variant={restaurant.isExternal ? 'outline' : 'secondary'}>
                {restaurant.sourceLabel}
              </Badge>
              {restaurant.priceLabel && (
                <span className="text-xs font-semibold text-primary">{restaurant.priceLabel}</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {restaurant.dietaryTags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Trường phái ẩm thực
              </h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {restaurant.dietaryTags.map((tag, index) => (
                  <Badge key={tag} variant="secondary">
                    {restaurant.dietaryTagLabels[index] ?? tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {restaurant.requiresDietaryWarning && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-50/50 p-3 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                Nhãn chế độ ăn của quán này đến từ nhà cung cấp bản đồ và chưa được người kiểm duyệt
                xác nhận. Hãy liên hệ quán để chắc chắn trước khi đến.
              </span>
            </div>
          )}

          {restaurant.dishes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Món ăn gợi ý
              </h3>
              <ul className="mt-1.5 grid gap-2 sm:grid-cols-2">
                {restaurant.dishes.map((dish) => (
                  <li
                    key={dish}
                    className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-sm font-medium"
                  >
                    <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                    <span>{dish}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-2 border-t pt-3 sm:grid-cols-2 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4 shrink-0 text-foreground" />
              <span>{restaurant.openingHours ?? 'Chưa rõ giờ mở cửa'}</span>
            </p>
            {restaurant.phoneNumber && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4 shrink-0 text-foreground" />
                <a
                  href={`tel:${restaurant.phoneNumber}`}
                  className="hover:underline text-foreground"
                >
                  {restaurant.phoneNumber}
                </a>
              </p>
            )}
            {restaurant.websiteUrl && (
              <p className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                <Globe className="size-4 shrink-0 text-foreground" />
                <a
                  href={restaurant.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-primary truncate"
                >
                  {restaurant.websiteUrl}
                </a>
              </p>
            )}
          </div>

          {restaurant.isStale && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-50/50 p-3 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                Thông tin quán được ghi nhận hơn 30 ngày trước. Giờ mở cửa hoặc thực đơn có thể đã
                thay đổi, vui lòng liên hệ quán trước khi đến.
              </span>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground border-t pt-2">
            Nguồn dữ liệu: <strong>{restaurant.sourceLabel}</strong>.
            {restaurant.fetchedAt &&
              ` Cập nhật lần cuối: ${restaurant.fetchedAt.toLocaleDateString('vi-VN')}.`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
