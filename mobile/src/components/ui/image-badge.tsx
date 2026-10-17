import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useIconColors } from '@/lib/theme-colors';

/**
 * Nhãn nổi trên ảnh (thời gian nấu...). Nền và chữ lấy từ token theme qua `useIconColors` (hex) thay vì lớp
 * `bg-background/90`: lớp có độ trong suốt không áp dụng được cho biến CSS của NativeWind nên nền bị mất và chữ chìm vào ảnh.
 * Nền gần đặc + viền mảnh giúp đọc được trên cả ảnh sáng lẫn tối, ở chế độ sáng lẫn tối.
 */
export function ImageBadge({
  label,
  icon,
  style,
}: {
  label: string;
  /** Icon tạo từ màu `foreground` của theme để cùng tông với chữ. */
  icon?: (color: string) => ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useIconColors();

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: `${colors.foreground}26`,
          // Hex 8 ký tự: ~92% độ đặc.
          backgroundColor: `${colors.background}EB`,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        style,
      ]}>
      {icon ? icon(colors.foreground) : null}
      <Text
        numberOfLines={1}
        style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}
        className="shrink-0">
        {label}
      </Text>
    </View>
  );
}
