import { Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import type {
  DietaryImpactedProgram,
  DietaryRepairNutrition,
  DietaryRepairPreview,
} from '@/features/diet-preferences/types/diet-impact.model';

const NUTRIENTS: readonly { key: keyof DietaryRepairNutrition; label: string; unit: string }[] = [
  { key: 'calories', label: 'Năng lượng', unit: 'kcal' },
  { key: 'proteinGrams', label: 'Đạm', unit: 'g' },
  { key: 'fiberGrams', label: 'Chất xơ', unit: 'g' },
  { key: 'fatGrams', label: 'Chất béo', unit: 'g' },
  { key: 'carbohydrateGrams', label: 'Tinh bột', unit: 'g' },
];

function amount(value: number | null, unit: string): string {
  return value === null ? 'Chưa đủ dữ liệu' : `${Number(value.toFixed(2))} ${unit}`;
}

export function DietRepairPreview({
  preview,
  busy,
  error,
  onApply,
  onKeep,
  onCreateProgramRevision,
}: {
  preview: DietaryRepairPreview;
  busy: boolean;
  error: string | null;
  onApply: () => void;
  onKeep: () => void;
  onCreateProgramRevision: (program: DietaryImpactedProgram) => void;
}) {
  const canApply = preview.plans.some((plan) => plan.status === 'READY' && plan.replacements.length > 0);
  const needsReview = preview.plans.some((plan) => plan.status !== 'UNCHANGED');

  return (
    <View className="gap-5">
      <View className="gap-1">
        <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">Xem trước món thay thế</Text>
        <Text className="text-sm leading-5 text-muted-foreground">
          Thiết lập ăn uống đã được lưu. Thực đơn chỉ thay đổi khi bạn bấm Áp dụng. Các bữa phù hợp và ngày đã qua được giữ nguyên.
        </Text>
      </View>
      {preview.plans.map((plan) => (
        <View key={plan.planId} className="gap-4 rounded-xl border border-border bg-card p-4">
          <Text className="text-base font-semibold text-foreground">Tuần {plan.weekLabel}</Text>
          {plan.message ? <Text className="text-sm leading-5 text-muted-foreground">{plan.message}</Text> : null}
          {plan.status === 'UNCHANGED' ? (
            <Text className="text-sm leading-5 text-muted-foreground">
              Không có món nào cần thay trong phạm vi này. Nội dung thực đơn được giữ nguyên.
            </Text>
          ) : null}
          {plan.status === 'NO_CANDIDATES' ? (
            <Text className="text-sm leading-5 text-destructive">
              Chưa có đủ món thay thế phù hợp. Thực đơn này sẽ được giữ nguyên và vẫn có cảnh báo; bạn có thể đổi món thủ công hoặc thử lại sau.
            </Text>
          ) : null}
          {plan.status === 'PROGRAM_REVISION_REQUIRED' ? (
            <View className="gap-3">
              <Text className="text-sm leading-5 text-muted-foreground">
                Lộ trình đã xác nhận không được sửa trực tiếp. Hãy tạo bản điều chỉnh để xem lại và xác nhận sau khi thay món.
              </Text>
              {plan.programs.filter((program) => program.status === 'CONFIRMED').map((program) => (
                <View key={program.id} className="gap-2">
                  <Text className="text-sm font-medium text-foreground">{program.title}</Text>
                  <PrimaryButton
                    label="Tạo bản điều chỉnh"
                    variant="outline"
                    disabled={busy}
                    onPress={() => onCreateProgramRevision(program)}
                  />
                </View>
              ))}
            </View>
          ) : null}
          {plan.replacements.map((replacement) => (
            <View key={replacement.itemId} className="gap-1 border-t border-border pt-3">
              <Text className="text-xs text-muted-foreground">{replacement.dateLabel} · {replacement.mealTypeLabel}</Text>
              <Text className="text-sm text-muted-foreground">Trước: {replacement.beforeName}</Text>
              <Text className="text-sm font-semibold text-foreground">Sau: {replacement.afterName}</Text>
              <Text className="text-xs text-muted-foreground">
                {replacement.servings} khẩu phần · {amount(replacement.calories, 'kcal')}
              </Text>
            </View>
          ))}
          {plan.status === 'READY' && plan.replacements.length > 0 ? (
            <>
              <View className="gap-2 border-t border-border pt-3">
                <Text className="text-sm font-semibold text-foreground">Tổng dinh dưỡng ước tính của thực đơn</Text>
                {NUTRIENTS.map((nutrient) => (
                  <View key={nutrient.key} className="flex-row justify-between gap-4">
                    <Text className="text-xs text-muted-foreground">{nutrient.label}</Text>
                    <Text className="flex-1 text-right text-xs text-foreground">
                      {amount(plan.beforeNutrition[nutrient.key], nutrient.unit)} → {amount(plan.afterNutrition[nutrient.key], nutrient.unit)}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="gap-2 border-t border-border pt-3">
                <Text className="text-sm font-semibold text-foreground">Nhu cầu nguyên liệu sau thay món</Text>
                {plan.shoppingAfter.length > 0 ? plan.shoppingAfter.map((item) => {
                  const before = plan.shoppingBefore.find((entry) => entry.ingredientId === item.ingredientId && entry.unit === item.unit);
                  return (
                    <Text key={`${item.ingredientId}-${item.unit}`} className="text-xs leading-5 text-muted-foreground">
                      {item.canonicalName}: {amount(before?.amount ?? 0, item.unit)} → {amount(item.amount, item.unit)}
                    </Text>
                  );
                }) : <Text className="text-xs text-muted-foreground">Không có nguyên liệu cần tổng hợp.</Text>}
                {plan.shoppingBefore.filter((item) => !plan.shoppingAfter.some((after) => after.ingredientId === item.ingredientId && after.unit === item.unit)).map((item) => (
                  <Text key={`removed-${item.ingredientId}-${item.unit}`} className="text-xs leading-5 text-muted-foreground">
                    {item.canonicalName}: {amount(item.amount, item.unit)} → 0 {item.unit}
                  </Text>
                ))}
                <Text className="text-xs leading-5 text-muted-foreground">Số lượng trong tủ bếp và các lần mua đã xác nhận không thay đổi.</Text>
              </View>
            </>
          ) : null}
        </View>
      ))}
      {error ? <Text accessibilityRole="alert" className="text-sm leading-5 text-destructive">{error}</Text> : null}
      {canApply ? <PrimaryButton label="Áp dụng các món thay thế" loading={busy} onPress={onApply} /> : null}
      <PrimaryButton label={needsReview ? 'Giữ thực đơn, xử lý sau' : 'Hoàn tất'} variant="outline" disabled={busy} onPress={onKeep} />
    </View>
  );
}
