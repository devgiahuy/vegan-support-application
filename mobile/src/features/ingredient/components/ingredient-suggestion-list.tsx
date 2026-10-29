import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useIngredientsQuery } from '../queries/ingredient.queries';
import type { Ingredient } from '../types/ingredient.model';

const MIN_QUERY_LENGTH = 2;
const SUGGESTION_LIMIT = 6;

/**
 * Danh sách nguyên liệu chuẩn khớp với từ khóa (`GET /ingredients?q=`), tương đương
 * `IngredientSuggestions` của web. Ô nhập do màn hình giữ; chỉ chọn tường minh, không tự chọn hộ.
 */
export function IngredientSuggestionList({
  query,
  excludedIds,
  onSelect,
}: {
  query: string;
  excludedIds: readonly string[];
  onSelect: (ingredient: Ingredient) => void;
}) {
  const colors = useIconColors();
  const keyword = useDebouncedValue(query.trim(), 350);
  const enabled = keyword.length >= MIN_QUERY_LENGTH;
  const { data, isFetching, isError, refetch } = useIngredientsQuery({ q: keyword, limit: SUGGESTION_LIMIT }, { enabled });

  if (!enabled) return null;
  if (isError) {
    return (
      <Pressable onPress={() => void refetch()}>
        <Text className="text-xs text-destructive">Không tải được nguyên liệu. Chạm để thử lại.</Text>
      </Pressable>
    );
  }
  if (!data) {
    return isFetching ? <ActivityIndicator size="small" color={colors.primary} /> : null;
  }
  const items = data.items.filter((item) => !excludedIds.includes(item.id));
  if (items.length === 0) {
    return <Text className="text-xs text-muted-foreground">Không có nguyên liệu khớp trong danh mục.</Text>;
  }
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      {items.map((ingredient, index) => (
        <Pressable
          key={ingredient.id}
          accessibilityRole="button"
          onPress={() => onSelect(ingredient)}
          className={cn('px-3 py-2.5 active:bg-muted', index > 0 ? 'border-t border-border' : '')}
        >
          <Text className="text-sm font-medium text-foreground">{ingredient.canonicalName}</Text>
          <Text numberOfLines={1} className="text-[11px] text-muted-foreground">
            {ingredient.foodGroupLabel}
            {ingredient.aliases.length > 0 ? ` · Còn gọi: ${ingredient.aliases.map((alias) => alias.alias).join(', ')}` : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
