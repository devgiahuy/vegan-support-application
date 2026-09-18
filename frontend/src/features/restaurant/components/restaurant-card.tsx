import Link from 'next/link';
import { Clock, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from 'cn';
import type { Restaurant } from '../types/restaurant.model';

/** Card 1 quán: tên/địa chỉ/khoảng cách/món/đánh giá/giờ. Chỉ nhận Model. */
export function RestaurantCard({
  restaurant,
  highlighted,
  onSelect,
}: {
  restaurant: Restaurant;
  highlighted?: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <Card
      id={`restaurant-card-${restaurant.id}`}
      onClick={() => onSelect?.(restaurant.id)}
      className={cn('flex flex-col', highlighted && 'ring-2 ring-primary')}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{restaurant.name}</CardTitle>
        <p className="flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {restaurant.address}
            {restaurant.distanceLabel && ` · ${restaurant.distanceLabel}`}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">{restaurant.dietLabel}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        {restaurant.dishes.length > 0 && (
          <p className="line-clamp-2 text-sm">{restaurant.dishes.join(' · ')}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {restaurant.openingStatusLabel}
            {restaurant.rating !== null && (
              <>
                <Star className="ml-1 size-3.5" />
                {restaurant.rating.toFixed(1).replace('.', ',')}
                {restaurant.reviewCount !== null && ` (${restaurant.reviewCount})`}
              </>
            )}
          </span>
          <Button asChild variant="outline" size="sm">
            <Link href={`/restaurants/${restaurant.id}`}>Chi tiết</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
