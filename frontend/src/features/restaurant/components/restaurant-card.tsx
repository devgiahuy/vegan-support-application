'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Clock3,
  Globe,
  MapPin,
  Navigation,
  ShieldAlert,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Restaurant } from '../types/restaurant.model';
import { getExternalHttpUrl, getRestaurantDirectionsUrl } from '../utils/restaurant-links';

export interface RestaurantCardProps {
  restaurant: Restaurant;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

function RestaurantPhoto({ restaurant }: { restaurant: Restaurant }) {
  const [failed, setFailed] = React.useState(false);
  const src = getExternalHttpUrl(restaurant.thumbnailUrl);
  if (!src || failed) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 bg-secondary/60 text-primary">
        <UtensilsCrossed className="size-8" strokeWidth={1.4} aria-hidden="true" />
        <span className="text-xs font-medium">Quán chay</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={`Ảnh của ${restaurant.name}`}
      fill
      unoptimized
      sizes="(max-width: 640px) 112px, 160px"
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function RestaurantCard({ restaurant, isSelected = false, onSelect }: RestaurantCardProps) {
  const websiteUrl = getExternalHttpUrl(restaurant.websiteUrl);

  return (
    <Card
      id={`restaurant-card-${restaurant.id}`}
      role="listitem"
      aria-current={isSelected ? 'true' : undefined}
      className={cn(
        'scroll-mt-24 overflow-hidden rounded-2xl border bg-card shadow-none transition-none',
        isSelected ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/40'
      )}
    >
      <div className="flex items-start gap-4 p-4 sm:gap-5 sm:p-5">
        <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-secondary/50 sm:w-40">
          <RestaurantPhoto key={restaurant.thumbnailUrl ?? restaurant.id} restaurant={restaurant} />
          {onSelect && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                'absolute bottom-2 right-2 size-11 rounded-xl bg-background shadow-sm',
                isSelected && 'border-primary text-primary'
              )}
              onClick={() => onSelect(restaurant.id)}
              aria-pressed={isSelected}
              aria-label={`Hiện ${restaurant.name} trên bản đồ`}
              title="Hiện trên bản đồ"
            >
              <MapPin aria-hidden="true" />
            </Button>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <CardHeader className="gap-2 space-y-0 p-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {restaurant.distanceLabel && (
                <span className="inline-flex items-center gap-1 font-medium text-primary">
                  <Navigation className="size-3.5" aria-hidden="true" />
                  {restaurant.distanceLabel}
                </span>
              )}
              {restaurant.openStateLabel && (
                <span className="font-medium text-primary">{restaurant.openStateLabel}</span>
              )}
            </div>
            <CardTitle className="text-base leading-snug sm:text-lg">
              <h3>
                <Link
                  href={`/restaurants/${restaurant.id}`}
                  className="rounded-sm text-balance hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {restaurant.name}
                </Link>
              </h3>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {restaurant.ratingLabel ? (
                <>
                  <Star className="size-4 fill-warning text-warning" aria-hidden="true" />
                  <span className="font-semibold tabular-nums">{restaurant.ratingLabel}</span>
                  {restaurant.reviewCountLabel && (
                    <span className="text-xs text-muted-foreground">
                      ({restaurant.reviewCountLabel})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Chưa có đánh giá</span>
              )}
              {restaurant.priceLabel && (
                <span className="text-xs text-muted-foreground">· {restaurant.priceLabel}</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 p-0">
            {restaurant.address && (
              <p className="flex items-start gap-1.5 text-pretty text-xs leading-relaxed text-muted-foreground sm:text-sm">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span className="line-clamp-2">{restaurant.address}</span>
              </p>
            )}
            {restaurant.openingHours && (
              <p
                className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"
                title={restaurant.openingHours}
              >
                <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="line-clamp-1">{restaurant.openingHours}</span>
              </p>
            )}
            {restaurant.dietaryTagLabels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {restaurant.dietaryTagLabels.map((label) => (
                  <Badge key={label} variant="secondary">
                    {label}
                  </Badge>
                ))}
              </div>
            )}
            {restaurant.requiresDietaryWarning && (
              <p className="hidden items-start gap-1.5 text-xs leading-relaxed text-muted-foreground sm:flex">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Nhãn ăn chay chưa được kiểm duyệt. Hãy liên hệ quán để xác nhận.
              </p>
            )}
          </CardContent>
        </div>
      </div>
      <CardFooter className="flex flex-col items-stretch gap-3 border-t border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
          <span>{restaurant.sourceLabel}</span>
          {restaurant.isExternal && restaurant.attribution && <span>{restaurant.attribution}</span>}
          {restaurant.requiresDietaryWarning && (
            <span className="sm:hidden">Nhãn ăn chay chưa được kiểm duyệt.</span>
          )}
          {restaurant.isStale && <span>Thông tin hơn 30 ngày, có thể đã thay đổi.</span>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {websiteUrl && (
            <Button asChild variant="outline" size="icon" className="size-11 rounded-xl">
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Website của ${restaurant.name}`}
                title="Website của quán"
              >
                <Globe className="size-4" aria-hidden="true" />
              </a>
            </Button>
          )}
          <Button asChild size="sm" className="h-11 flex-1 rounded-xl sm:flex-none">
            <a
              href={getRestaurantDirectionsUrl(restaurant)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chỉ đường
              <ArrowUpRight className="size-4" data-icon="inline-end" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
