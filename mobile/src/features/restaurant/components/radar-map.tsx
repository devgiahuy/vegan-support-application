import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Compass, MapPin } from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import type { Restaurant } from '../types/restaurant.model';

/** Hệ số quy đổi độ → mét (xấp xỉ), dùng để chiếu tọa độ quanh tâm lên khung bản đồ. */
const LAT_METERS_PER_DEGREE = 110574;
const LNG_METERS_PER_DEGREE_AT_EQUATOR = 111320;

/**
 * Bản đồ "radar" trực quan, không dùng SDK bản đồ ngoài (đồng bộ `map-fallback.tsx` của web):
 * tâm là vị trí người dùng, các vòng tròn thể hiện bán kính tìm kiếm, mỗi quán là một ghim đánh số.
 * Bấm ghim để chọn quán; số trên ghim trùng với thứ tự trong danh sách bên dưới.
 */
export function RadarMap({
  items,
  center,
  radiusM,
  selectedId,
  onSelect,
}: {
  items: Restaurant[];
  center: { lat: number; lng: number };
  radiusM: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const colors = useIconColors();

  const plotted = React.useMemo(() => {
    const scaleRadius = Math.max(radiusM, 2000);
    const lngMetersPerDegree = LNG_METERS_PER_DEGREE_AT_EQUATOR * Math.cos((center.lat * Math.PI) / 180);
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.lat !== null && item.lng !== null)
      .map(({ item, index }) => {
        const dLatM = ((item.lat as number) - center.lat) * LAT_METERS_PER_DEGREE;
        const dLngM = ((item.lng as number) - center.lng) * lngMetersPerDegree;
        const x = Math.max(8, Math.min(92, 50 + (dLngM / scaleRadius) * 40));
        const y = Math.max(10, Math.min(90, 50 - (dLatM / scaleRadius) * 40));
        return { id: item.id, label: index + 1, x, y };
      });
  }, [items, center, radiusM]);

  const radiusLabel = radiusM >= 1000 ? `${radiusM / 1000} km` : `${radiusM} m`;

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-muted/40">
      <View className="flex-row items-center justify-between px-3 pt-3">
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Compass size={15} color={colors.primary} />
          </View>
          <View>
            <Text className="text-xs font-bold text-foreground">Bản đồ vị trí trực quan</Text>
            <Text className="text-[11px] text-muted-foreground">
              Bán kính {radiusLabel} • {plotted.length} quán
            </Text>
          </View>
        </View>
      </View>

      <View className="h-64 items-center justify-center">
        {/* Các vòng bán kính đồng tâm */}
        <View className="absolute h-[80%] w-[80%] rounded-full border border-dashed border-primary/25 bg-primary/5" />
        <View className="absolute h-[42%] w-[42%] rounded-full border border-primary/20 bg-primary/5" />

        {/* Vị trí người dùng ở tâm */}
        <View className="absolute h-3.5 w-3.5 rounded-full border-2 border-background bg-blue-500" />

        {plotted.map((pin) => {
          const selected = pin.id === selectedId;
          return (
            <Pressable
              key={pin.id}
              onPress={() => onSelect(pin.id)}
              accessibilityLabel={`Quán số ${pin.label}`}
              hitSlop={6}
              style={{
                position: 'absolute',
                top: `${pin.y}%`,
                left: `${pin.x}%`,
                transform: [{ translateX: -12 }, { translateY: -12 }],
              }}
              className={cn(
                'h-6 w-6 items-center justify-center rounded-full border-2 border-background',
                selected ? 'bg-cta' : 'bg-primary'
              )}>
              <Text className="text-[10px] font-bold text-white">{pin.label}</Text>
            </Pressable>
          );
        })}

        {plotted.length === 0 ? (
          <View className="absolute bottom-3 flex-row items-center gap-1.5 rounded-full bg-background/90 px-3 py-1">
            <MapPin size={12} color={colors.mutedForeground} />
            <Text className="text-[11px] text-muted-foreground">Chưa có quán nào trong khu vực này</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
