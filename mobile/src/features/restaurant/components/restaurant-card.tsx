import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Clock, MapPin, Navigation, Star, Tag, Utensils } from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import type { Restaurant } from '../types/restaurant.model';

/** Đường dẫn chi tiết quán; id nhà cung cấp có dấu `:` nên phải mã hóa. */
export function restaurantHref(id: string): Href {
  return `/restaurants/${encodeURIComponent(id)}` as Href;
}

/**
 * Card 1 quán chay — đồng bộ `frontend/.../restaurant-card.tsx`: tên, khoảng cách + nguồn dữ liệu,
 * địa chỉ, nhãn chế độ ăn, loại hình, trạng thái mở cửa. Bấm cả thẻ để mở chi tiết.
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
  const colors = useIconColors();

  return (
    <Link href={restaurantHref(restaurant.id)} asChild>
      <Pressable
        onPress={() => onSelect?.(restaurant.id)}
        className={cn(
          'gap-2 rounded-2xl border bg-card p-4',
          isSelected ? 'border-primary bg-primary/5' : 'border-border'
        )}>
        <Text numberOfLines={1} className="text-base font-bold text-foreground">
          {restaurant.name}
        </Text>

        <View className="flex-row flex-wrap items-center gap-1.5">
          {restaurant.distanceLabel ? (
            <View className="flex-row items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5">
              <Navigation size={11} color={colors.primary} />
              <Text className="text-xs font-bold text-primary">{restaurant.distanceLabel}</Text>
            </View>
          ) : (
            <Text className="text-[11px] text-muted-foreground">Lân cận</Text>
          )}
          <View className="rounded-md border border-border px-1.5 py-0.5">
            <Text className="text-[10px] text-muted-foreground">{restaurant.sourceLabel}</Text>
          </View>
          {restaurant.rating !== null ? (
            <View className="flex-row items-center gap-1">
              <Star size={12} color={colors.cta} fill={colors.cta} />
              <Text className="text-xs font-semibold text-foreground">{restaurant.rating.toFixed(1)}</Text>
              {restaurant.reviewCount !== null ? (
                <Text className="text-[11px] text-muted-foreground">({restaurant.reviewCount})</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View className="flex-row items-start gap-1.5">
          <MapPin size={14} color={colors.primary} />
          <Text numberOfLines={2} className="flex-1 text-xs text-muted-foreground">
            {restaurant.address}
          </Text>
        </View>

        {restaurant.dietTagLabels.length > 0 || !restaurant.dietaryReviewed ? (
          <View className="flex-row flex-wrap gap-1">
            {restaurant.dietTagLabels.map((label) => (
              <View key={label} className="flex-row items-center gap-1 rounded bg-muted px-1.5 py-0.5">
                <Tag size={10} color={colors.mutedForeground} />
                <Text className="text-[10px] font-medium text-muted-foreground">{label}</Text>
              </View>
            ))}
            {!restaurant.dietaryReviewed ? (
              <View className="rounded bg-amber-500/10 px-1.5 py-0.5">
                <Text className="text-[10px] font-medium text-amber-700">Chế độ ăn chưa xác minh</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {restaurant.categories.length > 0 ? (
          <View className="flex-row items-center gap-1.5">
            <Utensils size={12} color={colors.mutedForeground} />
            <Text numberOfLines={1} className="flex-1 text-xs text-foreground/80">
              {restaurant.categories.join(' · ')}
            </Text>
          </View>
        ) : null}

        <View className="mt-1 flex-row items-center justify-between gap-2 border-t border-border pt-2.5">
          <View className="flex-1 flex-row items-center gap-1.5">
            <Clock size={12} color={colors.mutedForeground} />
            <Text numberOfLines={1} className="flex-1 text-[11px] text-muted-foreground">
              {restaurant.openState ?? 'Giờ mở cửa chưa rõ'}
            </Text>
          </View>
          <View className="rounded-lg border border-input px-2.5 py-1">
            <Text className="text-xs font-medium text-foreground">Chi tiết</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
