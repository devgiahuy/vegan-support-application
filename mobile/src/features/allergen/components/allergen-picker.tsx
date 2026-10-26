import * as React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAllergenCatalogQuery } from '../queries/allergen.queries';
import { searchAllergens } from '../utils/allergen-search';
import type { AllergenOption } from '../types/allergen.model';

const SUGGESTION_LIMIT = 6;

/**
 * Ô tìm dị ứng theo tên trong danh mục chuẩn (`GET /allergens`). Chỉ gợi ý: người dùng
 * phải chạm chọn tường minh một mục, không tự chọn hộ kể cả khi chỉ còn một kết quả.
 * `query` do màn hình giữ để chặn lưu khi còn chữ chưa chọn.
 */
export function AllergenPicker({
  query,
  onQueryChange,
  selectedCodes,
  onSelect,
}: {
  query: string;
  onQueryChange: (next: string) => void;
  selectedCodes: ReadonlySet<string>;
  onSelect: (option: AllergenOption) => void;
}) {
  const colors = useIconColors();
  const { data: catalog, isLoading, isError, refetch } = useAllergenCatalogQuery();
  const suggestions = React.useMemo(
    () => searchAllergens(catalog ?? [], query, selectedCodes).slice(0, SUGGESTION_LIMIT),
    [catalog, query, selectedCodes]
  );
  const hasQuery = query.trim().length > 0;

  return (
    <View>
      <View className="flex-row items-center gap-2 rounded-xl border border-input bg-background px-3">
        <Search size={15} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Tìm theo tên (VD: đậu phộng, mè, sữa)"
          placeholderTextColor={colors.mutedForeground}
          className="h-11 flex-1 text-sm text-foreground"
        />
        {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {isError ? (
        <Pressable onPress={() => void refetch()}>
          <Text className="mt-1.5 text-[11px] text-destructive">
            Không tải được danh mục dị ứng. Chạm để thử lại.
          </Text>
        </Pressable>
      ) : null}

      {hasQuery && suggestions.length > 0 ? (
        <View className="mt-1.5 overflow-hidden rounded-xl border border-border bg-card">
          {suggestions.map((option, index) => (
            <Pressable
              key={option.code}
              onPress={() => onSelect(option)}
              className={cn('px-3 py-2.5 active:bg-muted', index > 0 ? 'border-t border-border' : '')}>
              <Text className="text-sm font-medium text-foreground">{option.label}</Text>
              {option.description ? (
                <Text numberOfLines={1} className="text-[11px] text-muted-foreground">
                  {option.description}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : hasQuery && catalog && !isLoading ? (
        <Text className="mt-1.5 text-[11px] text-muted-foreground">
          Không có mục khớp trong danh mục. Hãy thử tên khác, hoặc dùng “Dị ứng theo nguyên liệu” bên dưới.
        </Text>
      ) : null}
    </View>
  );
}
