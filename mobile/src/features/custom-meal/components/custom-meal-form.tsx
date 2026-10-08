import * as React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { IngredientPicker } from '@/features/ingredient/components/ingredient-picker';
import { useIconColors } from '@/lib/theme-colors';
import { customMealMapper } from '../mappers/custom-meal.mapper';
import { CustomMealTagInput } from './custom-meal-tag-input';
import type { CustomMeal, CustomMealFormValues, CustomMealIngredient } from '../types/custom-meal.model';

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function numberToText(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

function emptyIngredient(id: string): CustomMealIngredient {
  return {
    id,
    ingredientId: null,
    displayName: '',
    canonicalName: null,
    resolutionStatus: 'UNKNOWN',
    amount: 0,
    unit: 'g',
  };
}

/**
 * Form tạo/sửa bữa ăn tự tạo. Mỗi nguyên liệu có thể liên kết với nguyên liệu chuẩn bằng gợi ý tìm kiếm
 * (gửi kèm `ingredientId`); nếu sửa tên sau khi chọn thì liên kết bị bỏ để tránh lỗi lệch tên-id.
 * Chỉ số dinh dưỡng là số người dùng tự nhập, để trống = chưa có dữ liệu.
 */
export function CustomMealForm({
  initial,
  submitLabel,
  isSubmitting,
  onSubmit,
}: {
  initial?: CustomMeal | null;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: CustomMealFormValues) => Promise<void>;
}) {
  const colors = useIconColors();
  const [name, setName] = React.useState(initial?.name ?? '');
  const [notes, setNotes] = React.useState(initial?.notes ?? '');
  const [servings, setServings] = React.useState(String(initial?.servings ?? 1));
  const [sourceNote, setSourceNote] = React.useState(initial?.sourceNote ?? '');
  const [calories, setCalories] = React.useState(numberToText(initial?.calories));
  const [protein, setProtein] = React.useState(numberToText(initial?.proteinGrams));
  const [carbs, setCarbs] = React.useState(numberToText(initial?.carbsGrams));
  const [fat, setFat] = React.useState(numberToText(initial?.fatGrams));
  const [fiber, setFiber] = React.useState(numberToText(initial?.fiberGrams));
  const [tags, setTags] = React.useState<string[]>(initial?.tags ?? []);
  const [ingredients, setIngredients] = React.useState<CustomMealIngredient[]>(
    initial?.ingredients.length ? initial.ingredients : [emptyIngredient('local-1')]
  );

  const updateIngredient = (index: number, patch: Partial<CustomMealIngredient>) => {
    setIngredients((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const removeIngredient = (index: number) => {
    setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const submit = async () => {
    const cleanName = name.trim();
    const parsedServings = Math.trunc(Number(servings));
    if (cleanName.length < 1) {
      Alert.alert('Thiếu tên bữa ăn', 'Vui lòng nhập tên bữa ăn.');
      return;
    }
    if (!Number.isInteger(parsedServings) || parsedServings < 1 || parsedServings > 99) {
      Alert.alert('Số phần không hợp lệ', 'Số phần ăn phải từ 1 đến 99.');
      return;
    }
    const cleanIngredients = ingredients
      .map((item) => ({ ...item, displayName: item.displayName.trim(), unit: item.unit.trim() || 'g' }))
      .filter((item) => item.displayName.length > 0 && item.amount > 0);
    if (cleanIngredients.length === 0) {
      Alert.alert('Thiếu nguyên liệu', 'Thêm ít nhất 1 nguyên liệu có số lượng.');
      return;
    }
    await onSubmit({
      name: cleanName,
      notes,
      servings: parsedServings,
      sourceNote,
      userCalories: toNumberOrNull(calories),
      userProteinGrams: toNumberOrNull(protein),
      userCarbsGrams: toNumberOrNull(carbs),
      userFatGrams: toNumberOrNull(fat),
      userFiberGrams: toNumberOrNull(fiber),
      tags,
      ingredients: cleanIngredients,
    });
  };

  return (
    <View className="gap-4">
      <TextField label="Tên bữa ăn" value={name} onChangeText={setName} placeholder="VD: Cơm đậu hũ sốt nấm" />
      <TextField label="Ghi chú" value={notes} onChangeText={setNotes} placeholder="Cách nấu, cảm hứng..." multiline className="min-h-20 pt-3" />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField label="Số phần" value={servings} onChangeText={setServings} keyboardType="numeric" />
        </View>
        <View className="flex-1">
          <TextField label="Calo" value={calories} onChangeText={setCalories} keyboardType="numeric" />
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField label="Đạm (g)" value={protein} onChangeText={setProtein} keyboardType="numeric" />
        </View>
        <View className="flex-1">
          <TextField label="Carb (g)" value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField label="Béo (g)" value={fat} onChangeText={setFat} keyboardType="numeric" />
        </View>
        <View className="flex-1">
          <TextField label="Xơ (g)" value={fiber} onChangeText={setFiber} keyboardType="numeric" />
        </View>
      </View>
      <Text className="-mt-2 text-[11px] text-muted-foreground">
        Chỉ số dinh dưỡng là số bạn tự nhập; để trống nếu chưa biết (hệ thống không coi là 0).
      </Text>
      <TextField label="Nguồn/ghi chú riêng" value={sourceNote} onChangeText={setSourceNote} placeholder="VD: tag shopee chỉ là tag người dùng tự đặt, không gọi dịch vụ ngoài" />
      <CustomMealTagInput tags={tags} onChange={setTags} />

      <View className="gap-3 rounded-2xl border border-border p-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-bold text-foreground">Nguyên liệu</Text>
          <Pressable
            onPress={() => setIngredients((current) => [...current, emptyIngredient(`local-${Date.now()}`)])}
            className="flex-row items-center gap-1 rounded-full bg-primary px-3 py-1.5">
            <Plus size={13} color={colors.primaryForeground} />
            <Text className="text-xs font-semibold text-primary-foreground">Thêm</Text>
          </Pressable>
        </View>
        {ingredients.map((item, index) => (
          <View key={item.id} className="gap-2 rounded-xl border border-border p-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-muted-foreground">Nguyên liệu {index + 1}</Text>
              {ingredients.length > 1 ? (
                <Pressable onPress={() => removeIngredient(index)}>
                  <Trash2 size={15} color={colors.destructive} />
                </Pressable>
              ) : null}
            </View>
            <IngredientPicker
              placeholder="VD: Đậu hũ"
              value={{ displayName: item.displayName, ingredientId: item.ingredientId }}
              onChange={(next) =>
                updateIngredient(index, {
                  displayName: next.displayName,
                  ingredientId: next.ingredientId,
                  canonicalName: next.ingredientId ? next.displayName : null,
                })
              }
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  label="Lượng"
                  value={item.amount ? String(item.amount) : ''}
                  onChangeText={(value) => updateIngredient(index, { amount: Number(value.replace(',', '.')) || 0 })}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <TextField
                  label="Đơn vị"
                  value={item.unit}
                  onChangeText={(value) => updateIngredient(index, { unit: value })}
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      <PrimaryButton
        label={submitLabel}
        loading={isSubmitting}
        onPress={() => {
          void submit();
        }}
      />
    </View>
  );
}

export function toCustomMealCreateDto(values: CustomMealFormValues) {
  return customMealMapper.toCreateDto(values);
}
