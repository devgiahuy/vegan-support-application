import { Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { FOOD_ALLOWANCE_OPTIONS } from '@/features/diet-preferences/components/food-allowance-switches';
import type { DietaryImpact } from '@/features/diet-preferences/types/diet-impact.model';
import type { FoodAllowanceSelection } from '@/features/diet-preferences/types/food-allowances.model';

export function DietImpactReview({
  selection,
  impact,
  busy,
  error,
  onKeep,
  onReplace,
  onBack,
}: {
  selection: FoodAllowanceSelection;
  impact: DietaryImpact;
  busy: boolean;
  error: string | null;
  onKeep: () => void;
  onReplace: () => void;
  onBack: () => void;
}) {
  const affected = impact.affectedMealCount > 0;

  return (
    <View className="gap-5">
      <View className="gap-3 rounded-xl border border-border bg-card p-4">
        <Text className="text-lg font-semibold text-foreground">Xem lại thiết lập</Text>
        {FOOD_ALLOWANCE_OPTIONS.map((option) => (
          <View key={option.key} className="flex-row items-center justify-between gap-4">
            <Text className="flex-1 text-sm text-foreground">{option.label}</Text>
            <Text className="text-sm font-semibold text-primary">
              {selection[option.key] ? 'Được ăn' : 'Kiêng'}
            </Text>
          </View>
        ))}
        <Text className="text-xs leading-5 text-muted-foreground">
          Dị ứng và nguyên liệu kiêng vẫn được áp dụng. Thiết lập chưa được lưu cho đến khi bạn xác nhận bên dưới.
        </Text>
      </View>

      <View className={`gap-3 rounded-xl border p-4 ${affected ? 'border-amber-400/50 bg-amber-500/10' : 'border-primary/30 bg-primary/5'}`}>
        <Text accessibilityRole="header" className="text-base font-semibold text-foreground">
          {affected
            ? `${impact.affectedMealCount} bữa trong ${impact.affectedPlanCount} thực đơn cần xem lại`
            : 'Không có bữa ăn sắp tới bị ảnh hưởng'}
        </Text>
        <Text className="text-sm leading-5 text-muted-foreground">
          {affected
            ? 'Một số món không còn phù hợp hoặc chưa đủ dữ liệu để kiểm tra theo thiết lập mới. Bạn có thể tìm món thay thế hoặc giữ thực đơn và xử lý sau.'
            : 'Bạn có thể lưu thiết lập mới. Hệ thống không tự thay đổi những món đang phù hợp.'}
        </Text>
        {impact.plans.filter((plan) => plan.items.length > 0).map((plan) => (
          <View key={plan.planId} className="gap-2 border-t border-border pt-3">
            <Text className="text-sm font-semibold text-foreground">Tuần {plan.weekLabel}</Text>
            {plan.items.map((meal) => (
              <View key={meal.itemId} className="gap-0.5">
                <Text className="text-sm font-medium text-foreground">{meal.name}</Text>
                <Text className="text-xs text-muted-foreground">{meal.dateLabel} · {meal.mealTypeLabel}</Text>
                <Text className="text-xs leading-5 text-muted-foreground">
                  {meal.unverified ? 'Chưa xác minh được: ' : ''}{meal.reasonLabels.join('; ')}
                </Text>
              </View>
            ))}
            {plan.programs.some((program) => program.status === 'CONFIRMED') ? (
              <Text className="text-xs leading-5 text-muted-foreground">
                Thuộc lộ trình đã xác nhận: cần tạo bản điều chỉnh trước khi thay món.
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {error ? <Text accessibilityRole="alert" className="text-sm leading-5 text-destructive">{error}</Text> : null}
      {affected ? (
        <View className="gap-3">
          <PrimaryButton label="Tự động tìm món thay thế" loading={busy} onPress={onReplace} />
          <PrimaryButton label="Giữ thực đơn, xử lý sau" variant="outline" disabled={busy} onPress={onKeep} />
          <Text className="text-xs leading-5 text-muted-foreground">
            Giữ thực đơn sẽ giữ cảnh báo tại các bữa cần xử lý. Món không phù hợp không được xác nhận là phù hợp với thiết lập mới.
          </Text>
        </View>
      ) : (
        <PrimaryButton label="Xác nhận lưu" loading={busy} onPress={onKeep} />
      )}
      <PrimaryButton label="Quay lại chỉnh sửa" variant="outline" disabled={busy} onPress={onBack} />
    </View>
  );
}
