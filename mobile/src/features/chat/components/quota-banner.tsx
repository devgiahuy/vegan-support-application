import { Text, View } from 'react-native';
import { Sparkles, TriangleAlert } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import type { QuotaState } from '../types/chat.model';

/** Huy hiệu gọn "Còn x/y lượt" gắn trên thanh trên của màn chat. Khi hết lượt trả về null (dùng banner). */
export function QuotaPill({ quota }: { quota: QuotaState | null }) {
  const colors = useIconColors();
  if (!quota || quota.exhausted) return null;
  return (
    <View className="flex-row items-center gap-1 self-start rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1">
      <Sparkles size={11} color={colors.primary} />
      <Text className="text-[11px] font-medium text-primary">
        Còn {quota.remaining}/{quota.limit} lượt
      </Text>
    </View>
  );
}

/** Thông báo khi đã dùng hết lượt hỏi trong ngày; lịch sử vẫn xem được. */
export function QuotaExhaustedBanner({ quota }: { quota: QuotaState | null }) {
  if (!quota?.exhausted) return null;
  return (
    <View className="flex-row items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3">
      <TriangleAlert size={16} color="#b45309" />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-amber-900">Bạn đã dùng hết lượt hỏi hôm nay</Text>
        <Text className="mt-1 text-xs leading-relaxed text-amber-800">
          Hạn mức ({quota.used}/{quota.limit} câu hỏi) sẽ được cấp lại lúc {quota.resetAtLabel}. Lịch sử các cuộc trò chuyện trước đó vẫn xem lại được.
        </Text>
      </View>
    </View>
  );
}
