import { Pressable, Text, View } from 'react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import type { Restaurant } from '../types/restaurant.model';

/**
 * Popup "N quán gần nhau" khi bấm một cụm ghim — đồng bộ hộp thoại cụm của `map-fallback.tsx` trên web.
 * Chọn một quán sẽ đóng popup và chọn quán đó trên sơ đồ.
 */
export function MapClusterSheet({
  members,
  onSelect,
  onClose,
}: {
  members: Restaurant[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <FormSheet title={`${members.length} quán gần nhau`} variant="popup" onClose={onClose}>
      <Text className="text-xs leading-5 text-muted-foreground">
        Chọn một quán trong cụm để xem vị trí và chỉ đường. Bạn cũng có thể phóng to để tách các ghim.
      </Text>
      <View className="gap-2">
        {members.map((restaurant) => (
          <Pressable
            key={restaurant.id}
            accessibilityRole="button"
            onPress={() => onSelect(restaurant.id)}
            className="min-h-14 gap-1 rounded-xl border border-border bg-card px-3.5 py-3 active:bg-muted">
            <Text className="text-sm font-medium text-foreground">{restaurant.name}</Text>
            <Text className="text-xs text-muted-foreground">
              {restaurant.distanceLabel}
              {restaurant.distanceLabel && restaurant.address ? ' · ' : ''}
              {restaurant.address}
            </Text>
          </Pressable>
        ))}
      </View>
    </FormSheet>
  );
}
