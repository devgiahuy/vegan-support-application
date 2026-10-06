import { Text, View } from 'react-native';
import { Info, Wrench } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';

/** Banner bảo trì khi tính năng AI bị tắt — lịch sử vẫn xem được. */
export function FallbackNotice({ maintenance }: { maintenance: boolean }) {
  const colors = useIconColors();
  if (!maintenance) return null;
  return (
    <View className="flex-row items-start gap-2.5 rounded-2xl border border-border bg-card p-3">
      <Wrench size={16} color={colors.foreground} />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">Trợ lý đang bảo trì</Text>
        <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Bạn tạm thời chưa gửi được câu hỏi mới, nhưng lịch sử trò chuyện bên dưới vẫn xem được.
        </Text>
      </View>
    </View>
  );
}

/** Tuyên bố miễn trừ cố định, luôn hiển thị cuối màn chat. */
export function Disclaimer() {
  const colors = useIconColors();
  return (
    <View className="flex-row items-start gap-1.5">
      <Info size={13} color={colors.mutedForeground} style={{ marginTop: 2 }} />
      <Text className="flex-1 text-[11px] leading-relaxed text-muted-foreground">
        Trợ lý cung cấp thông tin tham khảo về ăn chay và dinh dưỡng, không thay thế tư vấn y tế chuyên nghiệp. Hãy hỏi ý kiến chuyên gia khi có vấn đề sức khỏe.
      </Text>
    </View>
  );
}
