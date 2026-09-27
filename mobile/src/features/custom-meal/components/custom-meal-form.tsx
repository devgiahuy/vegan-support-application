import * as React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { useIconColors } from '@/lib/theme-colors';
import { customMealMapper } from '../mappers/custom-meal.mapper';
import type { CustomMeal, CustomMealFormValues, CustomMealIngredient } from '../types/custom-meal.model';

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function ingredient(id: string): CustomMealIngredient {
  return { id, ingredientId: null, displayName: '', amount: 0, unit: 'g' };
}

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
  const [calories, setCalories] = React.useState(initial?.calories ? String(initial.calories) : '');
  const [protein, setProtein] = React.useState(initial?.proteinGrams ? String(initial.proteinGrams) : '');
  const [carbs, setCarbs] = React.useState(initial?.carbsGrams ? String(initial.carbsGrams) : '');
  const [fat, setFat] = React.useState(initial?.fatGrams ? String(initial.fatGrams) : '');
  const [tags, setTags] = React.useState((initial?.tags ?? []).join(', '));
  const [ingredients, setIngredients] = React.useState<CustomMealIngredient[]>(
    initial?.ingredients.length ? initial.ingredients : [ingredient('local-1')]
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
    if (cleanName.length < 2) {
      Alert.alert('Thieu ten bua an', 'Ten bua an can co it nhat 2 ky tu.');
      return;
    }
    if (!Number.isInteger(parsedServings) || parsedServings < 1) {
      Alert.alert('So phan khong hop le', 'So phan an phai lon hon 0.');
      return;
    }
    const cleanIngredients = ingredients
      .map((item) => ({ ...item, displayName: item.displayName.trim(), unit: item.unit.trim() || 'g' }))
      .filter((item) => item.displayName.length > 0 && item.amount > 0);
    if (cleanIngredients.length === 0) {
      Alert.alert('Thieu nguyen lieu', 'Them it nhat 1 nguyen lieu co so luong.');
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
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      ingredients: cleanIngredients,
    });
  };

  return (
    <View className="gap-4">
      <TextField label="Ten bua an" value={name} onChangeText={setName} placeholder="VD: Com dau hu sot nam" />
      <TextField label="Ghi chu" value={notes} onChangeText={setNotes} placeholder="Cach nau, cam hung..." multiline className="min-h-20 pt-3" />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField label="So phan" value={servings} onChangeText={setServings} keyboardType="numeric" />
        </View>
        <View className="flex-1">
          <TextField label="Calo" value={calories} onChangeText={setCalories} keyboardType="numeric" />
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField label="Dam g" value={protein} onChangeText={setProtein} keyboardType="numeric" />
        </View>
        <View className="flex-1">
          <TextField label="Carb g" value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
        </View>
        <View className="flex-1">
          <TextField label="Fat g" value={fat} onChangeText={setFat} keyboardType="numeric" />
        </View>
      </View>
      <TextField label="Nguon/ghi chu rieng" value={sourceNote} onChangeText={setSourceNote} placeholder="VD: Shopee tag la tag nguoi dung, khong goi API ngoai" />
      <TextField label="Tags" value={tags} onChangeText={setTags} placeholder="meal-prep, shopee, bua-trua" />

      <View className="gap-3 rounded-2xl border border-border p-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-bold text-foreground">Nguyen lieu</Text>
          <Pressable
            onPress={() => setIngredients((current) => [...current, ingredient(`local-${Date.now()}`)])}
            className="flex-row items-center gap-1 rounded-full bg-primary px-3 py-1.5">
            <Plus size={13} color={colors.primaryForeground} />
            <Text className="text-xs font-semibold text-primary-foreground">Them</Text>
          </Pressable>
        </View>
        {ingredients.map((item, index) => (
          <View key={item.id} className="gap-2 rounded-xl border border-border p-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-muted-foreground">Nguyen lieu {index + 1}</Text>
              {ingredients.length > 1 ? (
                <Pressable onPress={() => removeIngredient(index)}>
                  <Trash2 size={15} color={colors.destructive} />
                </Pressable>
              ) : null}
            </View>
            <TextField
              label="Ten"
              value={item.displayName}
              onChangeText={(value) => updateIngredient(index, { displayName: value })}
              placeholder="Dau hu"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  label="Luong"
                  value={item.amount ? String(item.amount) : ''}
                  onChangeText={(value) => updateIngredient(index, { amount: Number(value.replace(',', '.')) || 0 })}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <TextField
                  label="Don vi"
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

