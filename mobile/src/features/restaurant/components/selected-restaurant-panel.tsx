import { Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import type { Restaurant } from '../types/restaurant.model';
import { getRestaurantDirectionsUrl, restaurantHref } from '../utils/restaurant-links';

/**
 * Thẻ quán đang chọn dưới sơ đồ — đồng bộ khối `activeRestaurant` của `map-fallback.tsx`: tên (mở chi tiết), địa chỉ,
 * khoảng cách và nút "Chỉ đường" mở liên kết ngoài (ưu tiên `mapsUrl` của nhà cung cấp, không có thì dùng mẫu theo tọa độ).
 */
export function SelectedRestaurantPanel({ restaurant }: { restaurant: Restaurant | null }) {
  const colors = useIconColors();
  const router = useRouter();

  if (!restaurant) {
    return (
      // `key` riêng cho từng nhánh: hai nhánh đều là `View` ở cùng vị trí, nhưng chỉ nhánh có quán mới dùng `shadow-sm`
      // (NativeWind biến nó thành CSS variable). Không có key thì NativeWind coi đó là "nâng cấp" cùng một View, remount
      // và in cảnh báo bằng cách JSON-hóa props — bước này lại chạm vào context điều hướng và làm app crash.
      <View key="empty" className="h-28 items-center justify-center">
        <Text className="text-center text-xs text-muted-foreground">Chọn một ghim hoặc cụm số để xem quán.</Text>
      </View>
    );
  }

  const mapUrl = getRestaurantDirectionsUrl(restaurant);

  return (
    <View key={restaurant.id} className="h-28 flex-row items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 shadow-sm">
      <View className="min-w-0 flex-1">
        <Pressable accessibilityRole="link" onPress={() => router.push(restaurantHref(restaurant.id))}>
          <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
            {restaurant.name}
          </Text>
        </Pressable>
        <Text numberOfLines={1} className="mt-1 text-xs text-muted-foreground">
          {restaurant.address}
        </Text>
        {restaurant.distanceLabel ? <Text className="mt-1 text-xs font-medium text-primary">{restaurant.distanceLabel}</Text> : null}
      </View>
      {mapUrl ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Chỉ đường đến ${restaurant.name}`}
          onPress={() => void Linking.openURL(mapUrl)}
          className="h-11 shrink-0 flex-row items-center justify-center gap-1 rounded-xl bg-primary px-4 active:opacity-90">
          <Text className="text-sm font-semibold text-primary-foreground">Chỉ đường</Text>
          <ArrowUpRight size={16} color={colors.primaryForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}
