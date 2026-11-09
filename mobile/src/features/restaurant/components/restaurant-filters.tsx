import { Pressable, Text, TextInput, View } from 'react-native';
import { Filter, RotateCcw, Search, X } from 'lucide-react-native';

import { DropdownField, type DropdownOption } from '@/components/ui/dropdown-field';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { DIET_PATTERN_OPTIONS, KEYWORD_SUGGESTIONS, RADIUS_OPTIONS_M } from '../schemas/restaurant.schema';
import type { RestaurantDietPattern } from '../types/restaurant.model';

const RADIUS_DROPDOWN_OPTIONS: DropdownOption<number>[] = RADIUS_OPTIONS_M.map((option) => ({
  value: option,
  label: option >= 1000 ? `${option / 1000} km` : `${option} m`,
}));

const DIET_DROPDOWN_OPTIONS: DropdownOption<RestaurantDietPattern | 'ALL'>[] = [
  { value: 'ALL', label: 'Tất cả' },
  ...DIET_PATTERN_OPTIONS.map((option) => ({ value: option.value as RestaurantDietPattern, label: option.label })),
];

/**
 * Bộ lọc tìm quán — đồng bộ `RestaurantFilters` của web: ô tìm theo tên quán/món ăn (có nút xóa), bán kính, loại quán chay,
 * nút "Bộ lọc" nâng cao (kèm số bộ lọc đang bật), gợi ý "Thử tìm" và "Xoá bộ lọc".
 */
export function RestaurantFilters({
  query,
  radiusM,
  dietPattern,
  advancedCount,
  keywordActive,
  hasFilters,
  onQueryChange,
  onRadiusChange,
  onDietPatternChange,
  onOpenAdvanced,
  onClearAll,
}: {
  query: string;
  radiusM: number;
  dietPattern: RestaurantDietPattern | undefined;
  advancedCount: number;
  keywordActive: boolean;
  hasFilters: boolean;
  onQueryChange: (query: string) => void;
  onRadiusChange: (radiusM: number) => void;
  onDietPatternChange: (dietPattern: RestaurantDietPattern | undefined) => void;
  onOpenAdvanced: () => void;
  onClearAll: () => void;
}) {
  const colors = useIconColors();

  return (
    <View accessibilityLabel="Bộ lọc tìm quán" className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Tìm theo tên quán hoặc món ăn</Text>
        <View className="h-11 flex-row items-center gap-2 rounded-xl border border-input bg-background px-3.5">
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Bạn muốn ăn món chay gì hôm nay?"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
            className="h-11 flex-1 text-sm text-foreground"
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Xoá từ khoá tìm kiếm" onPress={() => onQueryChange('')} hitSlop={10} className="size-8 items-center justify-center">
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="flex-row gap-2">
        <DropdownField className="flex-1" label="Trong bán kính" value={radiusM} options={RADIUS_DROPDOWN_OPTIONS} onChange={onRadiusChange} />
        <DropdownField
          className="flex-1"
          label="Loại quán chay"
          value={dietPattern ?? 'ALL'}
          options={DIET_DROPDOWN_OPTIONS}
          onChange={(value) => onDietPatternChange(value === 'ALL' ? undefined : value)}
        />
      </View>

      <Pressable accessibilityRole="button" onPress={onOpenAdvanced} className="h-11 flex-row items-center justify-center gap-2 rounded-xl border border-input bg-background px-5 active:bg-muted">
        <Filter size={16} color={colors.foreground} />
        <Text className="text-sm font-medium text-foreground">Bộ lọc</Text>
        {advancedCount > 0 ? (
          <View accessibilityLabel={`${advancedCount} bộ lọc nâng cao đang bật`} className="min-w-5 items-center rounded-full bg-secondary px-1.5 py-0.5">
            <Text className="text-xs font-semibold text-secondary-foreground">{advancedCount}</Text>
          </View>
        ) : null}
      </Pressable>

      <View className="flex-row flex-wrap items-center gap-1.5">
        <Text className="mr-1 text-xs text-muted-foreground">Thử tìm</Text>
        {KEYWORD_SUGGESTIONS.map((keyword) => (
          <Pressable
            key={keyword}
            accessibilityRole="button"
            accessibilityState={{ selected: query === keyword }}
            onPress={() => onQueryChange(keyword)}
            className={cn('h-9 justify-center rounded-lg px-3', query === keyword ? 'bg-secondary' : 'active:bg-muted')}>
            <Text className="text-sm text-foreground">{keyword}</Text>
          </Pressable>
        ))}
        {hasFilters ? (
          <Pressable accessibilityRole="button" onPress={onClearAll} className="ml-auto h-9 flex-row items-center gap-1.5 rounded-lg px-2 active:bg-muted">
            <RotateCcw size={14} color={colors.foreground} />
            <Text className="text-sm text-foreground">Xoá bộ lọc</Text>
          </Pressable>
        ) : null}
      </View>

      {!keywordActive && advancedCount > 0 ? <Text className="text-xs text-muted-foreground">Bộ lọc nâng cao chỉ áp dụng khi tìm theo từ khoá.</Text> : null}
    </View>
  );
}
