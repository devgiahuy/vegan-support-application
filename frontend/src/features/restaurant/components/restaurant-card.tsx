'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Star,
  Utensils,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Restaurant } from '../types/restaurant.model';

export interface RestaurantCardProps {
  restaurant: Restaurant;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

/**
 * Thẻ một quán chay trong danh sách (FR-007).
 *
 * Nguồn dữ liệu và giới hạn phải nói rõ:
 * - Quán bên ngoài luôn hiện `attribution` và cảnh báo khi chế độ ăn chưa được duyệt (FR-008, FR-009).
 * - Quán không có tọa độ vẫn xuất hiện, chỉ không có khoảng cách (FR-041).
 *
 * Thẻ là vùng chọn được bằng chuột lẫn bàn phím (Enter/Space) — SC-004.
 *
 * Mọi nhãn đã được chuẩn bị sẵn trong Model — component không format lại.
 */
export function RestaurantCard({ restaurant, isSelected, onSelect }: RestaurantCardProps) {
  const hasOpeningHours = Boolean(restaurant.openingHours);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      // Space mặc định cuộn trang — chặn lại để Space chọn quán như Enter.
      event.preventDefault();
      onSelect?.(restaurant.id);
    },
    [onSelect, restaurant.id]
  );

  return (
    <Card
      id={`restaurant-card-${restaurant.id}`}
      role="listitem"
      tabIndex={0}
      aria-current={isSelected ? 'true' : undefined}
      onClick={() => onSelect?.(restaurant.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        'group flex cursor-pointer flex-col transition-[transform,opacity,box-shadow] duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'border-primary bg-primary/[0.04] shadow-md -translate-y-0.5 ring-2 ring-primary'
          : 'hover:border-primary/50 hover:shadow-xs hover:-translate-y-0.5'
      )}
    >
      <CardHeader className="space-y-1.5 p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle
            title={restaurant.name}
            className="line-clamp-1 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary"
          >
            {restaurant.name}
          </CardTitle>
          {restaurant.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.thumbnailUrl}
              alt=""
              loading="lazy"
              className="size-14 shrink-0 rounded-lg border object-cover"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {restaurant.distanceLabel && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Navigation className="size-3 fill-current" aria-hidden="true" />
              {restaurant.distanceLabel}
            </span>
          )}

          <Badge
            variant={restaurant.isExternal ? 'outline' : 'secondary'}
            className="h-5 px-1.5 text-[10px] font-normal"
          >
            {restaurant.sourceLabel}
          </Badge>

          {restaurant.ratingLabel && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <Star className="size-3 fill-current" aria-hidden="true" />
              {restaurant.ratingLabel}
              {restaurant.reviewCountLabel && (
                <span className="text-muted-foreground">({restaurant.reviewCountLabel})</span>
              )}
            </span>
          )}

          {restaurant.openStateLabel && (
            <Badge
              variant="outline"
              className="h-5 border-emerald-500/40 px-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300"
            >
              {restaurant.openStateLabel}
            </Badge>
          )}
        </div>

        {restaurant.address && (
          <p className="flex items-start gap-1 pt-0.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary/80" aria-hidden="true" />
            <span className="line-clamp-1">{restaurant.address}</span>
          </p>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2 p-4 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {restaurant.dietaryTagLabels.map((label) => (
            <Badge key={label} variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
              {label}
            </Badge>
          ))}
          {restaurant.priceLabel && (
            <span className="text-[11px] font-medium text-muted-foreground">
              {restaurant.priceLabel}
            </span>
          )}
        </div>

        {restaurant.dishes.length > 0 && (
          <p className="flex items-center gap-1 text-xs text-foreground/80">
            <Utensils className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{restaurant.dishes.join(' · ')}</span>
          </p>
        )}

        {restaurant.requiresDietaryWarning && (
          <p className="flex items-start gap-1.5 rounded-lg border border-amber-500/25 bg-amber-50/60 px-2 py-1.5 text-[11px] leading-relaxed text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
            <span>
              Nhãn chế độ ăn đến từ nhà cung cấp bản đồ và chưa được kiểm duyệt. Hãy liên hệ quán để
              chắc chắn trước khi đến.
            </span>
          </p>
        )}

        {restaurant.phoneNumber && (
          <a
            href={`tel:${restaurant.phoneNumber}`}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex w-fit items-center gap-1 text-[11px] text-muted-foreground hover:text-primary hover:underline"
            aria-label={`Gọi cho ${restaurant.name}, số ${restaurant.phoneNumber}`}
          >
            <Phone className="size-3 shrink-0" aria-hidden="true" />
            {restaurant.phoneNumber}
          </a>
        )}

        {restaurant.isExternal && restaurant.attribution && (
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            {restaurant.attribution}
          </p>
        )}

        {restaurant.isStale && (
          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Thông tin cập nhật cách đây hơn 30 ngày, có thể đã thay đổi.
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-2">
          <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3 shrink-0" aria-hidden="true" />
            <span className="max-w-[140px] truncate">
              {hasOpeningHours ? restaurant.openingHours : 'Chưa rõ giờ mở cửa'}
            </span>
          </span>

          <div className="flex shrink-0 items-center gap-1.5">
            {restaurant.mapsUrl && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 rounded-lg px-2 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <a href={restaurant.mapsUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">Mở {restaurant.name} trong bản đồ</span>
                </a>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 rounded-lg px-2.5 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={`/restaurants/${restaurant.id}`}>Chi tiết</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
