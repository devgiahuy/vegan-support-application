import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';

import { IngredientSuggestionList } from '@/features/ingredient/components/ingredient-suggestion-list';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import type { DraftIngredientExclusion } from '../types/diet-preferences.model';
import { SearchBox } from './allergy-editor';

const exclusionKey = (entry: DraftIngredientExclusion) => entry.ingredientId ?? `name:${entry.ingredientName.trim().toLowerCase()}`;

/**
 * Nguyên liệu không ăn — đồng bộ `exclusion-editor.tsx` của web. Luôn là ràng buộc cứng ở backend;
 * ưu tiên nguyên liệu chuẩn, tên tự nhập chỉ là phương án dự phòng.
 */
export function ExclusionEditor({
  value,
  onChange,
  search,
  onSearchChange,
}: {
  value: DraftIngredientExclusion[];
  onChange: (value: DraftIngredientExclusion[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const colors = useIconColors();
  const [error, setError] = React.useState<string | null>(null);
  const query = search.trim();

  const isDuplicate = (name: string, id: string | undefined) =>
    value.some(
      (entry) => (id !== undefined && entry.ingredientId === id) || entry.ingredientName.trim().toLowerCase() === name.trim().toLowerCase()
    );

  const add = (entry: DraftIngredientExclusion) => {
    if (isDuplicate(entry.ingredientName, entry.ingredientId)) {
      setError(`“${entry.ingredientName}” đã có trong danh sách kiêng.`);
      return;
    }
    setError(null);
    onChange([...value, entry]);
    onSearchChange('');
  };

  const update = (key: string, patch: Partial<DraftIngredientExclusion>) =>
    onChange(value.map((entry) => (exclusionKey(entry) === key ? { ...entry, ...patch } : entry)));

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-base font-semibold text-foreground">Nguyên liệu không ăn</Text>
        <Text className="text-sm leading-5 text-muted-foreground">
          Dù không dị ứng, bạn vẫn có thể loại hẳn nguyên liệu mình không muốn ăn. Món chứa chúng sẽ không bao giờ được gợi ý.
        </Text>
      </View>

      <View className="gap-1.5">
        <SearchBox
          value={search}
          onChange={(next) => {
            setError(null);
            onSearchChange(next);
          }}
          placeholder="Tìm nguyên liệu, vd: dứa, sầu riêng, mắm tôm…"
          clearLabel="Xóa nội dung tìm kiếm nguyên liệu kiêng"
        />
        {error ? <Text accessibilityRole="alert" className="text-xs text-destructive">{error}</Text> : null}
      </View>

      {query.length >= 2 ? (
        <View className="gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <Text className="text-xs font-medium text-muted-foreground">Nguyên liệu chuẩn</Text>
          <IngredientSuggestionList
            query={search}
            excludedIds={value.flatMap((entry) => (entry.ingredientId ? [entry.ingredientId] : []))}
            onSelect={(item) => add({ ingredientId: item.id, ingredientName: item.canonicalName, reason: '' })}
          />
          <Text className="text-xs leading-4 text-muted-foreground">
            Không có trong danh mục? Tên tự nhập chỉ khớp theo tên nên lọc kém chính xác hơn.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => add({ ingredientName: query, reason: '' })}
            className="h-10 flex-row items-center justify-center gap-1.5 rounded-lg border border-input bg-background active:bg-muted"
          >
            <Plus size={14} color={colors.foreground} />
            <Text numberOfLines={1} className="shrink text-xs font-semibold text-foreground">Thêm “{query}”</Text>
          </Pressable>
        </View>
      ) : null}

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Đang kiêng ({value.length})</Text>
        {value.length === 0 ? (
          <Text className="text-sm text-muted-foreground">Chưa có nguyên liệu kiêng nào.</Text>
        ) : (
          <View className="overflow-hidden rounded-xl border border-border">
            {value.map((entry, index) => {
              const key = exclusionKey(entry);
              return (
                <View key={key} className={cn('gap-2 p-3', index > 0 ? 'border-t border-border' : '')}>
                  <View className="flex-row items-center gap-2">
                    <Text numberOfLines={2} className="shrink text-sm font-medium text-foreground">{entry.ingredientName}</Text>
                    <View className={cn('rounded-full px-2 py-0.5', entry.ingredientId ? 'bg-primary/10' : 'border border-border')}>
                      <Text className={cn('text-[11px] font-medium', entry.ingredientId ? 'text-primary' : 'text-muted-foreground')}>
                        {entry.ingredientId ? 'Chuẩn' : 'Tự nhập'}
                      </Text>
                    </View>
                    <View className="flex-1" />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Bỏ kiêng ${entry.ingredientName}`}
                      hitSlop={8}
                      onPress={() => onChange(value.filter((item) => exclusionKey(item) !== key))}
                      className="size-9 items-center justify-center rounded-lg"
                    >
                      <X size={16} color={colors.foreground} />
                    </Pressable>
                  </View>
                  <TextInput
                    value={entry.reason ?? ''}
                    onChangeText={(reason) => update(key, { reason })}
                    maxLength={500}
                    placeholder="Lý do (tùy chọn)"
                    placeholderTextColor={colors.mutedForeground}
                    accessibilityLabel={`Lý do kiêng ${entry.ingredientName}`}
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
