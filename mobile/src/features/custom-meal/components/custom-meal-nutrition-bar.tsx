import { Text, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Flame } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';
import type { CustomMeal } from '../types/custom-meal.model';

function formatValue(value: number | null, unit: string): string {
  return value === null ? 'Chưa nhập' : `${value} ${unit}`;
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[30%] flex-1 rounded-xl bg-muted/50 p-3">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="mt-1 text-base font-extrabold text-foreground">{value}</Text>
    </View>
  );
}

/**
 * Tổng hợp dinh dưỡng của món riêng — tương ứng `custom-meal-nutrition-bar` của web.
 * Backend chỉ trả số người dùng tự nhập (không có số tính từ nguyên liệu), nên chỉ hiển thị số đó và độ phủ
 * nguyên liệu đã liên kết danh mục chuẩn; chỉ số để trống nghĩa là chưa có dữ liệu, không phải 0.
 */
export function CustomMealNutritionBar({ meal }: { meal: CustomMeal }) {
  const colors = useIconColors();
  const total = meal.ingredientCount;
  const linked = total - meal.unlinkedIngredientCount;
  const percent = total > 0 ? Math.round((linked / total) * 100) : 0;
  const fullyLinked = total > 0 && percent === 100;

  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row items-center gap-2">
          <Flame size={18} color={colors.cta} />
          <Text className="flex-1 font-bold text-foreground">Dinh dưỡng bạn nhập (mỗi bữa)</Text>
        </View>
        {fullyLinked ? (
          <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
            <CheckCircle2 size={12} color={colors.primary} />
            <Text className="text-[11px] font-semibold text-primary">Bao phủ 100%</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row flex-wrap gap-2">
        <Tile label="Năng lượng" value={formatValue(meal.calories, 'kcal')} />
        <Tile label="Đạm" value={formatValue(meal.proteinGrams, 'g')} />
        <Tile label="Carb" value={formatValue(meal.carbsGrams, 'g')} />
        <Tile label="Béo" value={formatValue(meal.fatGrams, 'g')} />
        <Tile label="Xơ" value={formatValue(meal.fiberGrams, 'g')} />
      </View>

      {total > 0 ? (
        <View className="gap-1.5">
          <View className="flex-row justify-between gap-2">
            <Text className="flex-1 text-xs font-medium text-muted-foreground">Nguyên liệu liên kết danh mục chuẩn</Text>
            <Text className="text-xs font-semibold text-foreground">
              {linked}/{total} ({percent}%)
            </Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: percent }}
            className="h-2 overflow-hidden rounded-full bg-muted">
            <View className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </View>
        </View>
      ) : null}

      {meal.unlinkedIngredientCount > 0 ? (
        <View className="flex-row items-start gap-2 rounded-xl bg-cta/10 p-3">
          <AlertTriangle size={15} color={colors.cta} />
          <Text className="flex-1 text-xs leading-relaxed text-cta">
            {meal.unlinkedIngredientCount} nguyên liệu tự nhập chưa liên kết với danh mục chuẩn, nên hệ thống chưa đối
            chiếu được dinh dưỡng và cảnh báo của chúng. Hệ thống không coi nguyên liệu chưa biết là 0.
          </Text>
        </View>
      ) : null}

      <Text className="text-[11px] text-muted-foreground">
        {meal.nutritionCoverageLabel}. Chỉ số để trống nghĩa là chưa có dữ liệu, không phải 0.
      </Text>
    </View>
  );
}
