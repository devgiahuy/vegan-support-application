'use client';

import Link from 'next/link';
import { Clock, MapPin, Navigation, Tag, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Restaurant } from '../types/restaurant.model';

/**
 * Card 1 quán chay: Tên, địa chỉ, khoảng cách, món tiêu biểu, nhãn nguồn & chế độ ăn.
 * Thiết kế tối ưu không gian hiển thị, chống cắt cụt tên quán.
 */
export function RestaurantCard({
  restaurant,
  isSelected,
  onSelect,
}: {
  restaurant: Restaurant;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <Card
      id={`restaurant-card-${restaurant.id}`}
      onClick={() => onSelect?.(restaurant.id)}
      className={`group flex flex-col cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-primary border-primary bg-primary/[0.04] shadow-md -translate-y-0.5'
          : 'hover:border-primary/50 hover:shadow-xs hover:-translate-y-0.5'
      }`}
    >
      <CardHeader className="p-4 pb-2 space-y-1.5">
        {/* Tên quán hiển thị trọn vẹn, không bị ép co rút */}
        <CardTitle
          title={restaurant.name}
          className="text-base font-bold leading-snug line-clamp-1 text-foreground group-hover:text-primary transition-colors"
        >
          {restaurant.name}
        </CardTitle>

        {/* Hàng cự ly khoảng cách + nguồn dữ liệu */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {restaurant.distanceLabel ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Navigation className="size-3 fill-current" /> {restaurant.distanceLabel}
            </span>
          ) : (
            <span className="text-muted-foreground text-[11px]">Lân cận</span>
          )}

          <Badge
            variant={restaurant.source === 'INTERNAL' ? 'secondary' : 'outline'}
            className="text-[10px] font-normal px-1.5 py-0 h-5"
          >
            {restaurant.sourceLabel}
          </Badge>
        </div>

        {/* Địa chỉ quán */}
        <p className="flex items-start gap-1 text-xs text-muted-foreground pt-0.5">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary/80" />
          <span className="line-clamp-1">{restaurant.address}</span>
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 p-4 pt-1 flex-1">
        {/* Chế độ ăn */}
        {restaurant.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {restaurant.dietaryTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                <Tag className="size-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Món ăn nổi bật */}
        {restaurant.dishes.length > 0 && (
          <p className="flex items-center gap-1 text-xs text-foreground/80 line-clamp-1">
            <Utensils className="size-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{restaurant.dishes.join(' · ')}</span>
          </p>
        )}

        {restaurant.attribution && (
          <p className="text-xs text-muted-foreground">{restaurant.attribution}</p>
        )}
        {!restaurant.dietaryReviewed && restaurant.source !== 'INTERNAL' && (
          <p className="text-xs text-muted-foreground">
            Thông tin chế độ ăn và dị ứng chưa được xem xét.
          </p>
        )}
        {/* Chân thẻ: Giờ mở cửa + Nút xem chi tiết */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-border/50">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3 shrink-0" />
            <span className="truncate max-w-[130px]">
              {restaurant.openingHours ?? 'Giờ mở cửa chưa rõ'}
            </span>
          </span>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2.5 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/restaurants/${restaurant.id}`}>Chi tiết</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
