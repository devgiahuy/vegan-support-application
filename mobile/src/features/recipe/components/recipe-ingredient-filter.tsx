import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Carrot, X } from 'lucide-react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { IngredientPicker, type IngredientPickerValue } from '@/features/ingredient/components/ingredient-picker';
import { useIconColors } from '@/lib/theme-colors';

export interface IngredientFilterItem {
  id: string;
  name: string;
}

/** Backend chỉ nhận tối đa 20 nguyên liệu trong `ingredientIds`. */
export const MAX_FILTER_INGREDIENTS = 20;

const EMPTY_VALUE: IngredientPickerValue = { displayName: '', ingredientId: null };

function FilterSheet({
  initial,
  onApply,
  onClose,
}: {
  initial: IngredientFilterItem[];
  onApply: (items: IngredientFilterItem[]) => void;
  onClose: () => void;
}) {
  const colors = useIconColors();
  const [items, setItems] = React.useState(initial);
  const [value, setValue] = React.useState(EMPTY_VALUE);

  const handleChange = (next: IngredientPickerValue) => {
    // Chỉ nguyên liệu chuẩn (có id) mới lọc được; chọn xong thì thêm thành chip và xoá ô nhập để chọn tiếp.
    if (next.ingredientId) {
      const id = next.ingredientId;
      setItems((current) =>
        current.some((item) => item.id === id) || current.length >= MAX_FILTER_INGREDIENTS
          ? current
          : [...current, { id, name: next.displayName }]
      );
      setValue(EMPTY_VALUE);
      return;
    }
    setValue(next);
  };

  return (
    <FormSheet title="Lọc theo nguyên liệu" onClose={onClose} variant="popup">
      <Text className="text-xs leading-relaxed text-muted-foreground">
        Chọn các nguyên liệu bạn đang có. Danh sách chỉ hiện công thức chứa đủ tất cả nguyên liệu đã chọn (tối đa{' '}
        {MAX_FILTER_INGREDIENTS}).
      </Text>
      <IngredientPicker
        label="Thêm nguyên liệu"
        placeholder="Gõ tên rồi chọn gợi ý"
        value={value}
        onChange={handleChange}
      />
      {items.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {items.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Bỏ ${item.name}`}
              onPress={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
              className="min-h-9 flex-row items-center gap-1.5 rounded-full bg-primary/10 pl-3 pr-2">
              <Text className="text-xs font-medium text-primary">{item.name}</Text>
              <X size={13} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text className="text-xs text-muted-foreground">Chưa chọn nguyên liệu nào.</Text>
      )}
      <View className="flex-row gap-2">
        <PrimaryButton
          label="Xoá hết"
          variant="outline"
          disabled={items.length === 0}
          onPress={() => setItems([])}
          className="flex-1"
        />
        <PrimaryButton
          label="Áp dụng"
          onPress={() => {
            onApply(items);
            onClose();
          }}
          className="flex-1"
        />
      </View>
    </FormSheet>
  );
}

/** Nút mở bộ lọc nguyên liệu kèm các chip nguyên liệu đang áp dụng. */
export function RecipeIngredientFilter({
  items,
  onChange,
}: {
  items: IngredientFilterItem[];
  onChange: (items: IngredientFilterItem[]) => void;
}) {
  const colors = useIconColors();
  const [open, setOpen] = React.useState(false);

  return (
    <View className="mt-2 gap-2">
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className="h-11 flex-row items-center gap-2 rounded-xl border border-input bg-background px-3.5">
        <Carrot size={15} color={colors.primary} />
        <Text className="flex-1 text-sm text-foreground">
          {items.length > 0 ? `Nguyên liệu đang có (${items.length})` : 'Lọc theo nguyên liệu đang có'}
        </Text>
      </Pressable>
      {items.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {items.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Bỏ ${item.name}`}
              onPress={() => onChange(items.filter((entry) => entry.id !== item.id))}
              className="min-h-9 flex-row items-center gap-1.5 rounded-full bg-primary/10 pl-3 pr-2">
              <Text className="text-xs font-medium text-primary">{item.name}</Text>
              <X size={13} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      ) : null}
      {open ? <FilterSheet initial={items} onApply={onChange} onClose={() => setOpen(false)} /> : null}
    </View>
  );
}
