import * as React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Plus, Search, X } from 'lucide-react-native';

import { useAllergenCatalogQuery } from '@/features/allergen/queries/allergen.queries';
import { searchAllergens } from '@/features/allergen/utils/allergen-search';
import type { AllergenOption } from '@/features/allergen/types/allergen.model';
import { IngredientSuggestionList } from '@/features/ingredient/components/ingredient-suggestion-list';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import type { DraftAllergy, DraftIngredientAllergy } from '../types/diet-preferences.model';

export const SEVERITIES: { value: DraftAllergy['severity']; label: string }[] = [
  { value: 'MILD', label: 'Nhẹ' },
  { value: 'MODERATE', label: 'Trung bình' },
  { value: 'SEVERE', label: 'Nặng' },
];

function SeverityToggle({
  name,
  value,
  onChange,
}: {
  name: string;
  value: DraftAllergy['severity'];
  onChange: (value: DraftAllergy['severity']) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={`Mức độ dị ứng ${name}`} className="flex-row overflow-hidden rounded-lg border border-input">
      {SEVERITIES.map((item, index) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(item.value)}
            className={cn('h-9 items-center justify-center px-3', index > 0 ? 'border-l border-input' : '', selected ? 'bg-muted' : 'bg-background')}
          >
            <Text className={cn('text-xs', selected ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Tag({ children, tone = 'outline' }: { children: React.ReactNode; tone?: 'outline' | 'secondary' }) {
  return (
    <View className={cn('rounded-full px-2 py-0.5', tone === 'secondary' ? 'bg-primary/10' : 'border border-border')}>
      <Text className={cn('text-[11px] font-medium', tone === 'secondary' ? 'text-primary' : 'text-muted-foreground')}>{children}</Text>
    </View>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  clearLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearLabel: string;
}) {
  const colors = useIconColors();
  return (
    <View className="flex-row items-center gap-2 rounded-xl border border-input bg-background px-3">
      <Search size={15} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChange}
        maxLength={160}
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        className="h-11 flex-1 text-sm text-foreground"
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel={clearLabel} hitSlop={8} onPress={() => onChange('')}>
          <X size={15} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SelectedRow({
  name,
  badge,
  severity,
  onSeverityChange,
  onRemove,
  first,
}: {
  name: string;
  badge: { label: string; tone: 'outline' | 'secondary' };
  severity: DraftAllergy['severity'];
  onSeverityChange: (value: DraftAllergy['severity']) => void;
  onRemove: () => void;
  first: boolean;
}) {
  const colors = useIconColors();
  return (
    <View className={cn('gap-2 p-3', first ? '' : 'border-t border-border')}>
      <View className="flex-row items-center gap-2">
        <Text numberOfLines={2} className="shrink text-sm font-medium text-foreground">{name}</Text>
        <Tag tone={badge.tone}>{badge.label}</Tag>
      </View>
      <View className="flex-row items-center justify-between gap-2">
        <SeverityToggle name={name} value={severity} onChange={onSeverityChange} />
        <Pressable accessibilityRole="button" accessibilityLabel={`Bỏ dị ứng ${name}`} hitSlop={8} onPress={onRemove} className="size-9 items-center justify-center rounded-lg">
          <X size={16} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Khai báo dị ứng bằng một ô tìm kiếm — đồng bộ `allergy-editor.tsx` của web: kết quả gồm nhóm dị ứng
 * (áp dụng cả nhóm) và nguyên liệu chuẩn cụ thể; mức độ chỉnh trực tiếp trên từng mục đã chọn.
 */
export function AllergyEditor({
  allergies,
  onAllergiesChange,
  ingredientAllergies,
  onIngredientAllergiesChange,
  search,
  onSearchChange,
}: {
  allergies: DraftAllergy[];
  onAllergiesChange: (value: DraftAllergy[]) => void;
  ingredientAllergies: DraftIngredientAllergy[];
  onIngredientAllergiesChange: (value: DraftIngredientAllergy[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const colors = useIconColors();
  const { data: catalog, isLoading, isError, refetch } = useAllergenCatalogQuery();
  const query = search.trim();
  const selectedCodes = React.useMemo(() => new Set(allergies.map((a) => a.allergenCode)), [allergies]);
  const results = React.useMemo<AllergenOption[]>(
    () => (query ? searchAllergens(catalog ?? [], query, selectedCodes) : (catalog ?? []).filter((item) => !selectedCodes.has(item.code))),
    [catalog, query, selectedCodes]
  );
  const selectedCount = allergies.length + ingredientAllergies.length;

  const addGroup = (item: AllergenOption) => {
    onAllergiesChange([...allergies, { allergenCode: item.code, label: item.label, severity: 'MODERATE' }]);
    onSearchChange('');
  };

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-base font-semibold text-foreground">Dị ứng thực phẩm</Text>
        <Text className="text-sm leading-5 text-muted-foreground">
          Món chứa thứ bạn dị ứng sẽ bị loại khỏi mọi gợi ý, kể cả khi mức độ là nhẹ. Bỏ qua phần này nếu bạn không dị ứng.
        </Text>
      </View>

      <SearchBox
        value={search}
        onChange={onSearchChange}
        placeholder="Tìm nhóm dị ứng hoặc nguyên liệu, vd: đậu phộng, nấm hương…"
        clearLabel="Xóa nội dung tìm kiếm dị ứng"
      />

      <View className="gap-4 rounded-xl border border-border bg-muted/30 p-4">
        <View className="gap-2">
          <Text className="text-xs font-medium text-muted-foreground">
            {query ? 'Nhóm dị ứng phù hợp' : 'Nhóm dị ứng thường gặp'}
            <Text className="font-normal"> · áp dụng cho cả nhóm</Text>
          </Text>
          {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          {isError ? (
            <Pressable onPress={() => void refetch()}>
              <Text className="text-xs text-destructive">Không tải được danh mục dị ứng. Chạm để thử lại.</Text>
            </Pressable>
          ) : null}
          {!isLoading && !isError ? (
            results.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {results.map((item) => (
                  <Pressable
                    key={item.code}
                    accessibilityRole="button"
                    accessibilityLabel={`Thêm dị ứng ${item.label}`}
                    onPress={() => addGroup(item)}
                    className="flex-row items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1.5 active:bg-muted"
                  >
                    <Plus size={14} color={colors.foreground} />
                    <Text className="text-xs font-medium text-foreground">{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground">
                {query ? 'Không có nhóm dị ứng trùng tên.' : 'Bạn đã chọn tất cả nhóm trong danh mục.'}
              </Text>
            )
          ) : null}
        </View>

        {query.length >= 2 ? (
          <View className="gap-2">
            <Text className="text-xs font-medium text-muted-foreground">
              Nguyên liệu cụ thể
              <Text className="font-normal"> · chỉ nguyên liệu này và món có chứa nó</Text>
            </Text>
            <IngredientSuggestionList
              query={search}
              excludedIds={ingredientAllergies.map((entry) => entry.ingredientId)}
              onSelect={(item) => {
                onIngredientAllergiesChange([
                  ...ingredientAllergies,
                  { ingredientId: item.id, ingredientName: item.canonicalName, severity: 'MODERATE' },
                ]);
                onSearchChange('');
              }}
            />
          </View>
        ) : null}
        {query.length === 1 ? <Text className="text-xs text-muted-foreground">Nhập thêm ít nhất 1 ký tự để tìm nguyên liệu cụ thể.</Text> : null}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Đã khai báo ({selectedCount})</Text>
        {selectedCount === 0 ? (
          <Text className="text-sm text-muted-foreground">Chưa khai báo dị ứng nào.</Text>
        ) : (
          <View className="overflow-hidden rounded-xl border border-border">
            {allergies.map((entry, index) => (
              <SelectedRow
                key={`group-${entry.allergenCode}`}
                first={index === 0}
                name={catalog?.find((item) => item.code === entry.allergenCode)?.label ?? entry.label}
                badge={{ label: 'Cả nhóm', tone: 'secondary' }}
                severity={entry.severity}
                onSeverityChange={(severity) =>
                  onAllergiesChange(allergies.map((item) => (item.allergenCode === entry.allergenCode ? { ...item, severity } : item)))
                }
                onRemove={() => onAllergiesChange(allergies.filter((item) => item.allergenCode !== entry.allergenCode))}
              />
            ))}
            {ingredientAllergies.map((entry, index) => (
              <SelectedRow
                key={`ingredient-${entry.ingredientId}`}
                first={allergies.length === 0 && index === 0}
                name={entry.ingredientName}
                badge={{ label: 'Nguyên liệu', tone: 'outline' }}
                severity={entry.severity}
                onSeverityChange={(severity) =>
                  onIngredientAllergiesChange(ingredientAllergies.map((item) => (item.ingredientId === entry.ingredientId ? { ...item, severity } : item)))
                }
                onRemove={() => onIngredientAllergiesChange(ingredientAllergies.filter((item) => item.ingredientId !== entry.ingredientId))}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
