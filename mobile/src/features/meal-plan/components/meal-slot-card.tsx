import { Pressable, Text, View } from 'react-native';
import { Plus, Shuffle, TriangleAlert } from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import type { MealSlot } from '../types/meal-plan.model';

/**
 * Ô một bữa trong thực đơn — đồng bộ `SlotCard` của web: nhãn bữa, huy hiệu "Món cá nhân", huy hiệu cảnh báo
 * phân tích, tên món, số khẩu phần, và hành động đổi món / chọn món thủ công.
 */
export function MealSlotCard({
  slot,
  disabled,
  warningCount = 0,
  onWarningPress,
  onSwap,
  onPick,
}: {
  slot: MealSlot;
  disabled: boolean;
  warningCount?: number;
  onWarningPress?: (slot: MealSlot) => void;
  onSwap: (slot: MealSlot) => void;
  onPick: (slot: MealSlot) => void;
}) {
  const colors = useIconColors();

  return (
    <View
      className={cn(
        'gap-2 rounded-xl border p-3',
        slot.filled ? 'border-border bg-background' : 'border-dashed border-border bg-muted/40'
      )}>
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row flex-wrap items-center gap-1.5">
          <View className="rounded-full border border-border px-2 py-0.5">
            <Text className="text-[11px] font-medium text-foreground">{slot.mealTypeLabel}</Text>
          </View>
          {slot.isCustomMeal ? (
            <View className="rounded-full bg-primary/10 px-2 py-0.5">
              <Text className="text-[10px] font-medium text-primary">Món cá nhân</Text>
            </View>
          ) : null}
          {warningCount > 0 ? (
            <Pressable
              onPress={() => onWarningPress?.(slot)}
              accessibilityLabel={`${warningCount} cảnh báo dinh dưỡng`}
              className="flex-row items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5">
              <TriangleAlert size={11} color="#b45309" />
              <Text className="text-[10px] font-semibold text-amber-700">{warningCount} lưu ý</Text>
            </Pressable>
          ) : null}
        </View>
        {slot.filled ? <Text className="text-xs font-medium text-foreground">{slot.formattedCalories}</Text> : null}
      </View>

      {slot.filled ? (
        <View className="gap-0.5">
          <Text className="text-sm font-semibold leading-snug text-foreground">{slot.recipeTitle}</Text>
          <Text className="text-xs text-muted-foreground">
            Mục tiêu bữa {slot.targetCalories} kcal
            {slot.servings !== null ? ` · ${slot.servings} khẩu phần` : ''}
            {slot.customMealCoverage ? ` · ${slot.customMealCoverage}` : ''}
          </Text>
        </View>
      ) : (
        <Text className="py-1 text-xs italic text-muted-foreground">{slot.unfilledReason}</Text>
      )}

      <View className="flex-row items-center gap-2">
        {slot.filled ? (
          <Pressable
            disabled={disabled}
            onPress={() => onSwap(slot)}
            className="flex-row items-center gap-1 rounded-lg px-2 py-1.5 active:bg-muted">
            <Shuffle size={13} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">Đổi món</Text>
          </Pressable>
        ) : null}
        <Pressable
          disabled={disabled}
          onPress={() => onPick(slot)}
          className={cn(
            'flex-row items-center justify-center gap-1 rounded-lg border border-primary/30 px-2.5 py-1.5',
            slot.filled ? 'ml-auto' : 'flex-1'
          )}>
          <Plus size={13} color={colors.primary} />
          <Text className="text-xs font-semibold text-primary">{slot.filled ? 'Chọn món' : 'Thêm món vào ô này'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
