import { Text, View } from 'react-native';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react-native';

import { getAllergenName } from '@/common/constants/diet-labels';
import { useIconColors } from '@/lib/theme-colors';
import type { RecipeAllergyWarning } from '../types/recipe.model';

/**
 * Cảnh báo dị ứng ở chi tiết công thức:
 * 1. Chỉ hiện cảnh báo cá nhân ("Cảnh báo dị ứng theo hồ sơ của bạn") khi backend trả `allergyWarnings` khớp hồ sơ người xem.
 * 2. Hiển thị tách bạch danh sách mã dị ứng chung của công thức (`allergenCodes`) để người dùng tham khảo, không coi là cảnh báo cá nhân hay chứng nhận an toàn.
 */
export function RecipeAllergenHighlight({
  warnings = [],
  allergenCodes = [],
}: {
  warnings?: RecipeAllergyWarning[];
  allergenCodes?: string[];
}) {
  const colors = useIconColors();

  return (
    <View className="gap-3">
      {warnings.length > 0 ? (
        <View
          accessibilityRole="alert"
          accessibilityLabel="Cảnh báo dị ứng theo hồ sơ của bạn"
          className="gap-3 rounded-2xl border-2 border-destructive/60 bg-destructive/10 p-4">
          <View className="flex-row items-center gap-2.5">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-destructive">
              <ShieldAlert size={18} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-destructive">
                Cảnh báo dị ứng theo hồ sơ của bạn
              </Text>
              <Text className="text-xs text-foreground/80">
                Công thức có thành phần trùng với dị ứng bạn đã khai báo:
              </Text>
            </View>
          </View>
          <View className="gap-1.5">
            {warnings.map((warning) => (
              <View
                key={`${warning.kind}:${warning.identifier}`}
                className="flex-row flex-wrap items-center gap-2 rounded-xl border border-destructive/30 bg-background/80 px-3 py-2">
                <View className="rounded-lg bg-destructive/15 px-2 py-0.5">
                  <Text className="text-xs font-bold text-destructive">{warning.label}</Text>
                </View>
                {warning.ingredientNames.length > 0 ? (
                  <Text className="flex-1 text-xs text-foreground">
                    Trong nguyên liệu: {warning.ingredientNames.join(', ')}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
          <Text className="text-xs leading-relaxed text-foreground/80">
            Hãy kiểm tra kỹ thành phần trước khi dùng hoặc chọn công thức khác phù hợp hơn.
          </Text>
        </View>
      ) : null}

      {allergenCodes.length > 0 ? (
        <View className="gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <View className="flex-row items-center gap-2">
            <AlertTriangle size={16} color={colors.warning} />
            <Text className="flex-1 text-sm font-bold text-foreground">
              Thông tin chất gây dị ứng trong món
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {allergenCodes.map((code) => (
              <View
                key={code}
                className="rounded-xl border border-amber-500/40 bg-background/80 px-3 py-1">
                <Text className="text-xs font-semibold text-foreground">{getAllergenName(code)}</Text>
              </View>
            ))}
          </View>
          <Text className="text-[11px] leading-relaxed text-muted-foreground">
            Danh sách mô tả thành phần phổ biến của công thức, hãy kiểm tra kỹ từng nguyên liệu nếu bạn có tiền sử dị ứng.
          </Text>
        </View>
      ) : warnings.length === 0 ? (
        <View className="flex-row items-start gap-2.5 rounded-2xl border border-border bg-muted/40 p-3.5">
          <Info size={16} color={colors.mutedForeground} />
          <Text className="flex-1 text-xs leading-relaxed text-muted-foreground">
            Chưa ghi nhận cảnh báo dị ứng trùng với hồ sơ hay nhóm dị ứng phổ biến. Bạn vẫn nên tự kiểm tra kỹ từng nguyên liệu trước khi chế biến.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
