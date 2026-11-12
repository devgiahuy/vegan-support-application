import * as React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ArrowUpRight, Globe, MapPin, Navigation, ShieldAlert, Star, UtensilsCrossed } from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import type { Restaurant } from '../types/restaurant.model';
import { isExternalPlace } from '../utils/discovery-notices';
import { getExternalHttpUrl, getRestaurantDirectionsUrl, restaurantHref } from '../utils/restaurant-links';

function RestaurantPhoto({ restaurant }: { restaurant: Restaurant }) {
  const colors = useIconColors();
  const [failed, setFailed] = React.useState(false);
  const uri = getExternalHttpUrl(restaurant.thumbnailUrl);

  if (!uri || failed) {
    return (
      <View className="h-full w-full items-center justify-center gap-2 bg-secondary/60">
        <UtensilsCrossed size={32} color={colors.primary} strokeWidth={1.4} />
        <Text className="text-xs font-medium text-primary">Quán chay</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      contentFit="cover"
      onError={() => setFailed(true)}
      accessibilityLabel={`Ảnh của ${restaurant.name}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

/**
 * Thẻ một quán chay — đồng bộ `restaurant-card.tsx` của web: ảnh kèm nút ghim "Hiện trên bản đồ", khoảng cách, trạng thái
 * mở cửa, tên (mở chi tiết), đánh giá, địa chỉ, nhãn chế độ ăn, cảnh báo nhãn chưa kiểm duyệt, nguồn dữ liệu, website
 * và nút "Chỉ đường".
 */
export function RestaurantCard({
  restaurant,
  isSelected = false,
  onSelect,
}: {
  restaurant: Restaurant;
  isSelected?: boolean;
  /** Chọn quán để định vị trên sơ đồ. */
  onSelect?: (id: string) => void;
}) {
  const colors = useIconColors();
  const websiteUrl = getExternalHttpUrl(restaurant.website);
  const directionsUrl = getRestaurantDirectionsUrl(restaurant);
  const external = isExternalPlace(restaurant);
  const requiresDietaryWarning = !restaurant.dietaryReviewed;
  const ratingLabel = restaurant.rating !== null ? restaurant.rating.toFixed(1).replace('.', ',') : '';

  return (
    <View
      accessibilityState={{ selected: isSelected }}
      className={cn('overflow-hidden rounded-2xl border bg-card', isSelected ? 'border-primary' : 'border-border')}>
      <View className="flex-row items-start gap-3 p-3.5">
        <View className="size-28 shrink-0 overflow-hidden rounded-xl bg-secondary/50">
          <RestaurantPhoto key={restaurant.thumbnailUrl ?? restaurant.id} restaurant={restaurant} />
          {onSelect ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Hiện ${restaurant.name} trên bản đồ`}
              onPress={() => onSelect(restaurant.id)}
              className={cn(
                'absolute bottom-1.5 right-1.5 size-11 items-center justify-center rounded-xl border bg-background shadow-sm',
                isSelected ? 'border-primary' : 'border-border'
              )}>
              <MapPin size={20} color={isSelected ? colors.primary : colors.foreground} />
            </Pressable>
          ) : null}
        </View>

        <View className="min-w-0 flex-1 gap-2">
          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
            {restaurant.distanceLabel ? (
              <View className="flex-row items-center gap-1">
                <Navigation size={13} color={colors.primary} />
                <Text className="text-xs font-medium text-primary">{restaurant.distanceLabel}</Text>
              </View>
            ) : null}
            {restaurant.openState ? <Text className="text-xs font-medium text-primary">{restaurant.openState}</Text> : null}
          </View>

          <Link href={restaurantHref(restaurant.id)} asChild>
            <Pressable accessibilityRole="link">
              <Text className="text-base font-semibold leading-snug text-foreground">{restaurant.name}</Text>
            </Pressable>
          </Link>

          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            {ratingLabel ? (
              <>
                <Star size={15} color={colors.warning} fill={colors.warning} />
                <Text className="text-sm font-semibold text-foreground">{ratingLabel}</Text>
                {restaurant.reviewCount !== null && restaurant.reviewCount > 0 ? (
                  <Text className="text-xs text-muted-foreground">({Math.round(restaurant.reviewCount)} đánh giá)</Text>
                ) : null}
              </>
            ) : (
              <Text className="text-xs text-muted-foreground">Chưa có đánh giá</Text>
            )}
            {restaurant.price ? <Text className="text-xs text-muted-foreground">· {restaurant.price}</Text> : null}
          </View>

          {restaurant.address ? (
            <View className="flex-row items-start gap-1.5">
              <MapPin size={14} color={colors.mutedForeground} />
              <Text numberOfLines={2} className="flex-1 text-xs leading-5 text-muted-foreground">
                {restaurant.address}
              </Text>
            </View>
          ) : null}

          {restaurant.dietTagLabels.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5">
              {restaurant.dietTagLabels.map((label) => (
                <View key={label} className="rounded-md bg-secondary px-2 py-0.5">
                  <Text className="text-[11px] font-medium text-secondary-foreground">{label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View className="gap-3 border-t border-border/70 px-3.5 py-3">
        <View className="gap-1">
          <Text className="text-xs text-muted-foreground">{restaurant.sourceLabel}</Text>
          {external && restaurant.attribution ? <Text className="text-xs text-muted-foreground">{restaurant.attribution}</Text> : null}
          {requiresDietaryWarning ? (
            <View className="flex-row items-start gap-1.5">
              <ShieldAlert size={13} color={colors.mutedForeground} />
              <Text className="flex-1 text-xs leading-5 text-muted-foreground">Nhãn ăn chay chưa được kiểm duyệt. Hãy liên hệ quán để xác nhận.</Text>
            </View>
          ) : null}
          {restaurant.isStale ? <Text className="text-xs text-muted-foreground">Thông tin hơn 30 ngày, có thể đã thay đổi.</Text> : null}
        </View>
        <View className="flex-row items-center gap-2">
          {websiteUrl ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Website của ${restaurant.name}`}
              onPress={() => void Linking.openURL(websiteUrl)}
              className="size-11 items-center justify-center rounded-xl border border-input active:bg-muted">
              <Globe size={16} color={colors.foreground} />
            </Pressable>
          ) : null}
          {directionsUrl ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Chỉ đường đến ${restaurant.name}`}
              onPress={() => void Linking.openURL(directionsUrl)}
              className="h-11 flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-primary active:opacity-90">
              <Text className="text-sm font-semibold text-primary-foreground">Chỉ đường</Text>
              <ArrowUpRight size={16} color={colors.primaryForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
