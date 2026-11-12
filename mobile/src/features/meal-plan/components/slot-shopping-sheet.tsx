import * as React from 'react';
import { Text } from 'react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import { ShoppingPreviewView } from '@/features/shopping/components/shopping-preview-view';
import { useShoppingPreviewQuery } from '@/features/shopping/queries/shopping.queries';
import { mealsFromPlan } from '@/features/shopping/utils/plan-meals';
import type { MealSlot } from '../types/meal-plan.model';

function shortDate(date: string): string {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[2]}/${match[1]}` : date;
}

/**
 * Nguyên liệu cần mua cho riêng một bữa — đồng bộ hộp thoại "Xem nguyên liệu cần mua" của web.
 * Tồn kho được so sánh riêng cho món này (các món khác có thể dùng chung nguyên liệu); chỉ xem trước, không đổi Tủ bếp.
 * Query chỉ chạy khi sheet đang mở.
 */
export function SlotShoppingSheet({ slot, onClose }: { slot: MealSlot; onClose: () => void }) {
  const meals = React.useMemo(() => mealsFromPlan([slot]), [slot]);
  const preview = useShoppingPreviewQuery(meals.length > 0 ? meals : null);

  return (
    <FormSheet title={slot.recipeTitle || 'Nguyên liệu cần mua'} onClose={onClose}>
      <Text className="text-xs leading-5 text-muted-foreground">
        {[slot.mealTypeLabel, shortDate(slot.date)].filter(Boolean).join(' · ')}. Tồn kho được so sánh riêng cho món này; các món khác có thể dùng chung nguyên liệu.
      </Text>
      <ShoppingPreviewView preview={preview} />
    </FormSheet>
  );
}
