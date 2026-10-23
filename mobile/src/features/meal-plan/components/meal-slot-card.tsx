import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Plus, Shuffle, TriangleAlert, UtensilsCrossed } from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import type { MealSlot } from '../types/meal-plan.model';

/** Nhãn thân thiện cho lý do ô trống do backend trả (đồng bộ web). */
const UNRESOLVED_LABELS: Record<string, string> = {
  UNFILLED_SLOT: 'Chưa xếp món',
  NO_HARD_COMPATIBLE_CANDIDATE: 'Không có món phù hợp bộ lọc',
  ALLERGY_VIOLATION: 'Trùng nguyên liệu dị ứng',
  DIET_PATTERN_MISMATCH: 'Không khớp chế độ ăn',
  EXCLUDED_INGREDIENT: 'Chứa nguyên liệu cần tránh',
  HARD_CONSTRAINT_BLOCKED: 'Bảo vệ yêu cầu ăn kiêng',
};

function SlotThumbnail({ uri }: { uri: string | null }) {
  const colors = useIconColors();
  const [failed, setFailed] = React.useState(false);

  if (!uri || failed) {
    return (
      <View className="h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/40">
        <UtensilsCrossed size={20} color={colors.mutedForeground} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      contentFit="cover"
      onError={() => setFailed(true)}
      style={{ width: 48, height: 48, borderRadius: 8 }}
    />
  );
}

/**
 * Ô một bữa trong thực đơn — đồng bộ `SlotCard` của web: nhãn bữa, huy hiệu "Món cá nhân", huy hiệu cảnh báo
 * phân tích, ảnh + tên món, đạm/bột/béo/xơ, số khẩu phần, và hành động đổi món / chọn món thủ công.
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
  const hasMacros = slot.protein > 0 || slot.carbs > 0 || slot.fat > 0 || slot.fiber > 0;
  const servingsText = slot.servings !== null && slot.servings > 0 ? `${slot.servings} khẩu phần` : null;

  return (
    <View
      className={cn(
        'gap-2.5 rounded-xl border p-3.5',
        slot.filled ? 'border-border bg-card' : 'border-dashed border-border bg-muted/20'
      )}>
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row flex-wrap items-center gap-1.5">
          <View className="rounded-full border border-border px-2.5 py-0.5">
            <Text className="text-xs font-medium text-foreground">{slot.mealTypeLabel}</Text>
          </View>
          {slot.isCustomMeal ? (
            <View className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5">
              <Text className="text-[10px] font-medium text-primary">Món cá nhân</Text>
            </View>
          ) : null}
          {warningCount > 0 ? (
            <Pressable
              onPress={() => onWarningPress?.(slot)}
              accessibilityLabel={`${warningCount} cảnh báo dinh dưỡng`}
              className="flex-row items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5">
              <TriangleAlert size={11} color={colors.warning} />
              <Text className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">{warningCount} lưu ý</Text>
            </Pressable>
          ) : null}
        </View>
        {slot.filled ? <Text className="text-xs font-semibold text-foreground">{slot.formattedCalories}</Text> : null}
      </View>

      {slot.filled ? (
        <View className="flex-row items-start gap-2.5">
          <SlotThumbnail uri={slot.coverImageUrl} />
          <View className="min-w-0 flex-1 gap-1">
            <Text numberOfLines={2} className="text-sm font-semibold leading-snug text-foreground">
              {slot.recipeTitle}
            </Text>
            {hasMacros ? (
              <Text className="text-xs leading-4 text-muted-foreground">
                Đạm {slot.protein}g · Bột {slot.carbs}g · Béo {slot.fat}g
                {slot.fiber > 0 ? ` · Xơ ${slot.fiber}g` : ''}
                {servingsText ? ` · ${servingsText}` : ''}
              </Text>
            ) : (
              <Text className="text-xs leading-4 text-muted-foreground">
                {[servingsText, slot.customMealCoverage].filter(Boolean).join(' · ') || `Mục tiêu bữa ${slot.targetCalories} kcal`}
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View className="items-start gap-1.5 py-1">
          <Text className="text-xs italic leading-5 text-muted-foreground">
            {slot.unfilledReason || 'Chưa có món phù hợp với calo hoặc luật ăn bữa này.'}
          </Text>
          {slot.unresolvedCode ? (
            <View className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5">
              <Text className="text-[10px] text-amber-700 dark:text-amber-400">
                {UNRESOLVED_LABELS[slot.unresolvedCode] ?? slot.unresolvedCode}
              </Text>
            </View>
          ) : null}
        </View>
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
