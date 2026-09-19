import { Text, View } from 'react-native';
import { Clock, MapPin } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';
import type { Restaurant } from '../types/restaurant.model';

/** Card 1 quán: tên/địa chỉ/khoảng cách/món/giờ, đồng bộ `frontend/.../restaurant-card.tsx`. */
export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const colors = useIconColors();

  return (
    <View className="gap-2 rounded-2xl border border-border bg-card p-4">
      <Text className="text-base font-bold text-foreground">{restaurant.name}</Text>
      <View className="flex-row items-start gap-1.5">
        <MapPin size={14} color={colors.mutedForeground} />
        <Text className="flex-1 text-xs text-muted-foreground">
          {restaurant.address}
          {restaurant.distanceLabel ? ` · ${restaurant.distanceLabel}` : ''}
        </Text>
      </View>

      {restaurant.dishes.length > 0 ? (
        <Text numberOfLines={2} className="text-sm text-foreground">
          {restaurant.dishes.join(' · ')}
        </Text>
      ) : null}

      <View className="mt-1 flex-row items-center gap-1.5 border-t border-border pt-2.5">
        <Clock size={13} color={colors.mutedForeground} />
        <Text className="text-xs text-muted-foreground">
          {restaurant.openingHours ?? 'Giờ mở cửa chưa rõ'}
        </Text>
      </View>
    </View>
  );
}
