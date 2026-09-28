import { Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';
import type { Restaurant } from '../types/restaurant.model';

/**
 * Khung bản đồ minh họa (KHÔNG tải SDK bản đồ ngoài), đồng bộ
 * `frontend/src/features/restaurant/components/map-placeholder.tsx`: giữ đúng
 * tỉ lệ + pin theo tọa độ tương đối của cùng tập kết quả, ghi rõ là minh hoạ.
 */
export function MapPlaceholder({ items }: { items: Restaurant[] }) {
  const colors = useIconColors();
  const plotted = items.filter((item) => item.lat !== null && item.lng !== null).slice(0, 20);
  const lats = plotted.map((item) => item.lat as number);
  const lngs = plotted.map((item) => item.lng as number);
  const minLat = Math.min(...lats, 0);
  const maxLat = Math.max(...lats, 1);
  const minLng = Math.min(...lngs, 0);
  const maxLng = Math.max(...lngs, 1);

  const toPercent = (lat: number, lng: number) => ({
    top: `${100 - ((lat - minLat) / (maxLat - minLat || 1)) * 100}%` as const,
    left: `${((lng - minLng) / (maxLng - minLng || 1)) * 100}%` as const,
  });

  return (
    <View className="h-64 overflow-hidden rounded-2xl border border-border bg-muted/40">
      {plotted.map((item) => {
        const position = toPercent(item.lat as number, item.lng as number);
        return (
          <View
            key={item.id}
            style={{ position: 'absolute', top: position.top, left: position.left, transform: [{ translateX: -10 }, { translateY: -20 }] }}>
            <MapPin size={20} color={colors.primary} />
          </View>
        );
      })}
      {/* Màu cố định (không theo theme) — nền pill có thể đè lên pin/màu nền thay đổi,
          không thể dựa vào token sáng/tối để đảm bảo tương phản. */}
      <View className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1">
        <Text className="text-[11px] text-white">
          Bản đồ minh họa — bản đồ tương tác có khi backend sẵn sàng
        </Text>
      </View>
    </View>
  );
}
