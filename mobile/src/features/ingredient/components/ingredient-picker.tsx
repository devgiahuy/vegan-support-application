import * as React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { CheckCircle2, Search } from 'lucide-react-native';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useIngredientsQuery } from '../queries/ingredient.queries';
import type { Ingredient } from '../types/ingredient.model';

export interface IngredientPickerValue {
  displayName: string;
  /** Id nguyên liệu chuẩn; null khi người dùng tự nhập tên tự do. */
  ingredientId: string | null;
}

const MIN_QUERY_LENGTH = 2;
const SUGGESTION_LIMIT = 6;

/**
 * Ô nhập tên nguyên liệu kèm gợi ý nguyên liệu chuẩn (`GET /ingredients?q=`, tìm không dấu).
 * - Người dùng phải CHỌN tường minh một gợi ý để gắn `ingredientId`; không tự chọn hộ khi có nhiều ứng viên.
 * - Sửa lại tên sau khi đã chọn sẽ bỏ `ingredientId` (backend từ chối id không khớp tên: `INGREDIENT_ID_NAME_MISMATCH`).
 * - Không chọn gợi ý nào vẫn dùng được như tên tự do (backend sẽ đối chiếu danh mục khi lưu).
 */
export function IngredientPicker({
  label,
  placeholder,
  value,
  onChange,
  className,
}: {
  label?: string;
  placeholder?: string;
  value: IngredientPickerValue;
  onChange: (next: IngredientPickerValue) => void;
  className?: string;
}) {
  const colors = useIconColors();
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const keyword = useDebouncedValue(value.displayName.trim(), 350);
  const canSearch = showSuggestions && value.ingredientId === null && keyword.length >= MIN_QUERY_LENGTH;

  const { data, isFetching } = useIngredientsQuery({ q: keyword, limit: SUGGESTION_LIMIT }, { enabled: canSearch });
  const suggestions: Ingredient[] = canSearch ? (data?.items ?? []) : [];

  const handleChange = (text: string) => {
    setShowSuggestions(true);
    onChange({ displayName: text, ingredientId: null });
  };

  const handleSelect = (ingredient: Ingredient) => {
    setShowSuggestions(false);
    onChange({ displayName: ingredient.canonicalName, ingredientId: ingredient.id });
  };

  return (
    <View className={className}>
      {label ? <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">{label}</Text> : null}
      <View
        className={cn(
          'flex-row items-center gap-2 rounded-xl border bg-background px-3',
          value.ingredientId ? 'border-primary/50' : 'border-input'
        )}>
        {value.ingredientId ? (
          <CheckCircle2 size={15} color={colors.primary} />
        ) : (
          <Search size={15} color={colors.mutedForeground} />
        )}
        <TextInput
          value={value.displayName}
          onChangeText={handleChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder ?? 'Tên nguyên liệu'}
          placeholderTextColor={colors.mutedForeground}
          className="h-11 flex-1 text-sm text-foreground"
        />
        {canSearch && isFetching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {value.ingredientId ? (
        <Text className="mt-1 text-[11px] text-primary">Đã chọn nguyên liệu chuẩn trong danh mục.</Text>
      ) : value.displayName.trim().length >= MIN_QUERY_LENGTH && !showSuggestions ? (
        <Text className="mt-1 text-[11px] text-muted-foreground">
          Tên tự nhập — chọn một gợi ý để liên kết với nguyên liệu chuẩn.
        </Text>
      ) : null}

      {canSearch && suggestions.length > 0 ? (
        <View className="mt-1.5 overflow-hidden rounded-xl border border-border bg-card">
          {suggestions.map((ingredient, index) => (
            <Pressable
              key={ingredient.id}
              onPress={() => handleSelect(ingredient)}
              className={cn('px-3 py-2.5 active:bg-muted', index > 0 ? 'border-t border-border' : '')}>
              <Text className="text-sm font-medium text-foreground">{ingredient.canonicalName}</Text>
              <Text numberOfLines={1} className="text-[11px] text-muted-foreground">
                {ingredient.foodGroupLabel}
                {ingredient.aliases.length > 0
                  ? ` · Còn gọi: ${ingredient.aliases.map((alias) => alias.alias).join(', ')}`
                  : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : canSearch && !isFetching && data && suggestions.length === 0 ? (
        <Text className="mt-1 text-[11px] text-muted-foreground">
          Không có nguyên liệu khớp trong danh mục — bạn vẫn có thể dùng tên tự nhập.
        </Text>
      ) : null}
    </View>
  );
}
