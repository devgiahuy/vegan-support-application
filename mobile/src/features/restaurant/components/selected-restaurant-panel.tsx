import { Linking, Pressable, Text, View } from 'react-native';
import { ExternalLink, Navigation } from 'lucide-react-native';

import { buildDirectionsUrl } from '@/lib/env';
import { useIconColors } from '@/lib/theme-colors';
import type { Restaurant } from '../types/restaurant.model';

/**
 * Thẻ quán đang chọn dưới bản đồ (radar hoặc MapLibre): tên, địa chỉ và nút mở Google Maps để chỉ đường bằng liên kết
 * ngoài (ưu tiên `mapsUrl` của nhà cung cấp, nếu không có thì dùng mẫu chỉ đường theo tọa độ).
 */
export function SelectedRestaurantPanel({ restaurant }: { restaurant: Restaurant | null }) {
  const colors = useIconColors();

  if (!restaurant) {
    return (
      <Text className="mx-3 mb-3 text-[11px] text-muted-foreground">
        Chạm vào ghim để xem địa chỉ và mở bản đồ để chỉ đường.
      </Text>
    );
  }

  const mapUrl =
    restaurant.mapsUrl ??
    (restaurant.lat !== null && restaurant.lng !== null ? buildDirectionsUrl(restaurant.lat, restaurant.lng) : '');

  return (
    <View className="mx-3 mb-3 rounded-xl border border-border bg-background/85 p-3">
      <View className="flex-row items-start gap-2">
        <Navigation size={15} color={colors.primary} />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
            {restaurant.name}
          </Text>
          <Text numberOfLines={2} className="mt-0.5 text-xs text-muted-foreground">
            {restaurant.address}
          </Text>
        </View>
      </View>
      {mapUrl ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mở bản đồ đến ${restaurant.name}`}
          onPress={() => void Linking.openURL(mapUrl)}
          className="mt-3 flex-row items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5">
          <ExternalLink size={14} color={colors.primaryForeground} />
          <Text className="text-xs font-semibold text-primary-foreground">Mở bản đồ / chỉ đường</Text>
        </Pressable>
      ) : (
        <Text className="mt-2 text-[11px] text-muted-foreground">
          Quán này chưa có liên kết bản đồ từ nhà cung cấp. Mở chi tiết để xem địa chỉ và liên hệ.
        </Text>
      )}
    </View>
  );
}
