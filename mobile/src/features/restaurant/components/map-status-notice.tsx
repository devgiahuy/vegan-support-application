import { Pressable, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';

const EXPAND_OPTIONS_M = [10000, 20000, 50000] as const;

/**
 * Ghi chú trạng thái đặt BÊN DƯỚI bản đồ (không đè lên bản đồ): nhắc chọn vị trí khi chưa có, hoặc gợi ý mở rộng bán kính
 * khi không tìm thấy quán — đồng bộ khối "Chưa có quán chay trong bán kính" của web. Không hiện gì khi đã có kết quả.
 */
export function MapStatusNotice({
  hasLocation,
  isEmpty,
  radiusM,
  onRadiusChange,
}: {
  hasLocation: boolean;
  isEmpty: boolean;
  radiusM: number;
  onRadiusChange: (radiusM: number) => void;
}) {
  const colors = useIconColors();

  if (!hasLocation) {
    return (
      <View className="flex-row items-center gap-2 px-3 pb-1 pt-3">
        <MapPin size={14} color={colors.primary} />
        <Text className="flex-1 text-[11px] leading-4 text-muted-foreground">
          Bấm nút định vị trên bản đồ, nhập địa chỉ, hoặc kéo bản đồ rồi bấm “Tìm trong vùng đang xem” để tìm quán.
        </Text>
      </View>
    );
  }
  if (!isEmpty) return null;

  const radiusLabel = radiusM >= 1000 ? `${radiusM / 1000} km` : `${radiusM} m`;
  const expandOptions = EXPAND_OPTIONS_M.filter((option) => option > radiusM);
  return (
    <View className="mx-3 mt-3 items-center gap-2 rounded-xl border border-dashed border-border bg-background p-3">
      <MapPin size={20} color={colors.mutedForeground} />
      <Text className="text-center text-xs font-semibold text-foreground">
        Chưa có quán chay trong bán kính {radiusLabel}
      </Text>
      {expandOptions.length > 0 ? (
        <View className="flex-row flex-wrap items-center justify-center gap-2">
          {expandOptions.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => onRadiusChange(option)}
              className="rounded-full border border-border bg-card px-3 py-1.5 active:bg-muted">
              <Text className="text-[11px] font-semibold text-foreground">Mở rộng {option / 1000} km</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text className="text-center text-[11px] text-muted-foreground">Hãy thử đổi từ khóa hoặc chọn khu vực khác.</Text>
      )}
    </View>
  );
}
