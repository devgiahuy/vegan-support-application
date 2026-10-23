import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { ListFilter, ShoppingCart, Sparkles, Warehouse } from 'lucide-react-native';

import { ShowMoreButton, useShowMore } from '@/components/shared/show-more';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ShoppingPreviewView } from '@/features/shopping/components/shopping-preview-view';
import { useShoppingPreviewQuery } from '@/features/shopping/queries/shopping.queries';
import type { SelectedShoppingMeal } from '@/features/shopping/types/shopping.model';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import type { ShoppingListItem } from '../types/meal-plan.model';

type Mode = 'smart' | 'all';

const ALL_ITEMS_LIMIT = 8;

function AllIngredients({ items }: { items: ShoppingListItem[] }) {
  const list = useShowMore(items, ALL_ITEMS_LIMIT);

  if (items.length === 0) {
    return <Text className="py-6 text-center text-sm text-muted-foreground">Chưa có nguyên liệu nào trong thực đơn.</Text>;
  }
  return (
    <View className="gap-2">
      {list.visible.map((item, index) => (
        <View
          key={`${item.ingredientId ?? item.name}-${index}`}
          className="flex-row items-center justify-between gap-2 rounded-xl border border-border bg-muted/50 px-3.5 py-2.5">
          <Text numberOfLines={1} className="flex-1 text-sm font-medium text-foreground">
            {item.name}
          </Text>
          <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {item.quantity} {item.unit}
          </Text>
        </View>
      ))}
      <ShowMoreButton
        collapsible={list.collapsible}
        expanded={list.expanded}
        hiddenCount={list.hiddenCount}
        onPress={list.toggle}
      />
    </View>
  );
}

/**
 * Danh sách đi chợ của thực đơn tuần — đồng bộ `ShoppingList` của web, 2 chế độ: "Đi chợ thông minh" (đối chiếu với Tủ
 * bếp, tự tải khi có món; chỉ xem trước, không đổi tồn kho) và "Tất cả nguyên liệu" (tổng nguyên liệu của thực đơn).
 */
export function PlanShoppingList({ items, meals }: { items: ShoppingListItem[]; meals: SelectedShoppingMeal[] }) {
  const colors = useIconColors();
  const hasMeals = meals.length > 0;
  const [mode, setMode] = React.useState<Mode>('smart');
  const activeMode: Mode = hasMeals ? mode : 'all';
  const preview = useShoppingPreviewQuery(hasMeals && activeMode === 'smart' ? meals : null);

  const modes: { value: Mode; label: string; icon: React.ReactNode }[] = [
    { value: 'smart', label: 'Đi chợ thông minh', icon: <Sparkles size={12} color={colors.primary} /> },
    { value: 'all', label: 'Tất cả nguyên liệu', icon: <ListFilter size={12} color={colors.mutedForeground} /> },
  ];

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <View className="gap-3 border-b border-border p-4">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60">
            <ShoppingCart size={16} color={colors.primary} />
          </View>
          <Text className="text-base font-bold text-foreground">Danh sách đi chợ</Text>
          <Text className="text-xs text-muted-foreground">({items.length} nguyên liệu)</Text>
        </View>

        {hasMeals ? (
          <View className="flex-row gap-1 self-start rounded-xl bg-muted p-1">
            {modes.map((item) => (
              <Pressable
                key={item.value}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeMode === item.value }}
                onPress={() => setMode(item.value)}
                className={cn(
                  'flex-row items-center gap-1 rounded-lg px-2.5 py-1.5',
                  activeMode === item.value ? 'bg-background' : ''
                )}>
                {item.icon}
                <Text
                  className={cn(
                    'text-xs',
                    activeMode === item.value ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View className="gap-4 p-4">
        {activeMode === 'smart' ? (
          <>
            <ShoppingPreviewView preview={preview} />
            <Link href={'/pantry' as Href} asChild>
              <PrimaryButton
                label="Mở Tủ bếp"
                variant="outline"
                icon={<Warehouse size={16} color={colors.foreground} />}
              />
            </Link>
          </>
        ) : (
          <AllIngredients items={items} />
        )}
      </View>
    </View>
  );
}
