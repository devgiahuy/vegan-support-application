import { Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';

import { PrimaryButton } from '@/components/ui/primary-button';
import type { DietaryCompatibility } from '@/features/diet-preferences/types/diet-impact.model';

/** Đọc assessment do backend trả; không suy sự phù hợp từ thông báo đã đóng trên thiết bị. */
export function DietaryCompatibilityBanner({
  compatibility,
  repairHref,
  compact = false,
}: {
  compatibility: DietaryCompatibility | null;
  repairHref?: Href;
  compact?: boolean;
}) {
  if (!compatibility || compatibility.status !== 'NEEDS_REVIEW') return null;

  return (
    <View accessibilityRole="alert" className="gap-3 rounded-xl border border-amber-400/50 bg-amber-500/10 p-4">
      <Text className="text-sm font-semibold text-foreground">
        {compatibility.affectedMealCount > 0
          ? `${compatibility.affectedMealCount} bữa cần xem lại theo hồ sơ ăn uống hiện tại`
          : 'Thực đơn cần được xem lại theo hồ sơ ăn uống hiện tại'}
      </Text>
      {!compact ? (
        <>
          <Text className="text-xs leading-5 text-muted-foreground">
            Nội dung thực đơn đang được giữ nguyên. Những món dưới đây không còn phù hợp hoặc chưa đủ dữ liệu để xác minh; giữ thực đơn không có nghĩa chúng phù hợp với thiết lập mới.
          </Text>
          {compatibility.items.map((meal) => (
            <View key={meal.itemId} className="gap-0.5 border-t border-amber-400/20 pt-2">
              <Text className="text-sm font-medium text-foreground">{meal.name}</Text>
              <Text className="text-xs text-muted-foreground">{meal.dateLabel} · {meal.mealTypeLabel}</Text>
              <Text className="text-xs leading-5 text-muted-foreground">
                {meal.unverified ? 'Chưa xác minh được: ' : ''}{meal.reasonLabels.join('; ')}
              </Text>
            </View>
          ))}
          {repairHref ? (
            <Link href={repairHref} asChild>
              <PrimaryButton label="Tìm món thay thế" variant="outline" />
            </Link>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
