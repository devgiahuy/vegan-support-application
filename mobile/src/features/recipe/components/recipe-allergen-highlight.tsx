import { Text, View } from 'react-native';
import { AlertTriangle, Info } from 'lucide-react-native';

import { getAllergenName } from '@/common/constants/diet-labels';
import { useIconColors } from '@/lib/theme-colors';

/**
 * Cảnh báo dị ứng nổi bật ở chi tiết công thức. Chỉ phản ánh mã dị ứng backend đã ghi nhận cho công thức;
 * khi không có mã nào, không khẳng định công thức "an toàn" — người dùng vẫn cần tự kiểm tra nguyên liệu.
 */
export function RecipeAllergenHighlight({ allergenCodes }: { allergenCodes: string[] }) {
  const colors = useIconColors();

  if (allergenCodes.length === 0) {
    return (
      <View className="flex-row items-start gap-2.5 rounded-2xl border border-border bg-muted/40 p-3.5">
        <Info size={16} color={colors.mutedForeground} />
        <Text className="flex-1 text-xs leading-relaxed text-muted-foreground">
          Chưa ghi nhận chất gây dị ứng phổ biến cho công thức này. Nếu bạn bị dị ứng, vẫn nên đọc kỹ danh sách nguyên liệu.
        </Text>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel="Cảnh báo dị ứng thực phẩm"
      className="gap-3 rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 p-4">
      <View className="flex-row items-center gap-2.5">
        <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-500">
          <AlertTriangle size={16} color="#ffffff" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-amber-950">Cảnh báo dị ứng thực phẩm</Text>
          <Text className="text-xs text-amber-900/80">Công thức có thành phần có thể gây dị ứng:</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {allergenCodes.map((code) => (
          <View key={code} className="rounded-xl border border-amber-500/50 bg-amber-500/20 px-3 py-1.5">
            <Text className="text-xs font-bold text-amber-950">{getAllergenName(code)}</Text>
          </View>
        ))}
      </View>
      <Text className="border-t border-amber-500/20 pt-2 text-[11px] leading-relaxed text-amber-900/80">
        Hãy kiểm tra kỹ hoặc thay bằng nguyên liệu an toàn nếu bạn có tiền sử mẫn cảm với các chất trên.
      </Text>
    </View>
  );
}
