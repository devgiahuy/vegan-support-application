import * as React from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/utils';
import { MapFrame, useSearchHere } from './map-frame';
import type { RestaurantMapProps } from './restaurant-map-types';

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
  hasLocation,
  isEmpty,
  selectedId,
  onSelect,
  onRadiusChange,
  onSearchHere,
  onUseMyLocation,
  locating,
}: RestaurantMapProps) {
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

  const selectedRestaurant = React.useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );
  const searchHere = useSearchHere(center, onSearchHere);

  return (
    <MapFrame
      radiusM={radiusM}
      pinCount={plotted.length}
      hiddenCount={0}
      hasLocation={hasLocation}
      isEmpty={isEmpty}
      selectedRestaurant={selectedRestaurant}
      searchHere={searchHere}
      showZoom={false}
      onLocate={onUseMyLocation}
      locating={locating}
      onRadiusChange={onRadiusChange}>
      <View className="flex-1 items-center justify-center">
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
      </View>
    </MapFrame>
  );
}
