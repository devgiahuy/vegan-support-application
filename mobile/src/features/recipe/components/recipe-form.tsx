import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { PlusCircle, Send, Trash2 } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { CategoryType, RecipeDifficulty } from '@/common/enums';
import { CategoryFilterPills } from '@/features/category/components/category-filter-pills';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { IngredientPicker, type IngredientPickerValue } from '@/features/ingredient/components/ingredient-picker';
import type { CreateRecipeIngredientInput, CreateRecipeInput } from '../api/recipe.api';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

const DIFFICULTY_OPTIONS: { value: RecipeDifficulty; label: string }[] = [
  { value: RecipeDifficulty.EASY, label: 'Dễ' },
  { value: RecipeDifficulty.MEDIUM, label: 'Trung bình' },
  { value: RecipeDifficulty.HARD, label: 'Nâng cao' },
];

const MIN_BODY_LENGTH = 20;

function splitTags(value: string): string[] {
  return value.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 15);
}

interface DraftIngredient extends CreateRecipeIngredientInput {
  key: string;
}

interface DraftStep {
  key: string;
  instruction: string;
  duration: string;
}

export interface RecipeFormInitial {
  title?: string;
  excerpt?: string;
  tags?: string[];
  categoryId?: string | null;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: RecipeDifficulty;
  calories?: number;
  protein?: number;
  ingredients?: { displayName: string; amount: number; unit: string; ingredientId?: string | null }[];
  steps?: { instruction: string; durationMinutes?: number | null }[];
}

function toDraftSteps(initial: RecipeFormInitial['steps']): DraftStep[] {
  if (!initial || initial.length === 0) return [{ key: 'step-0', instruction: '', duration: '' }];
  return initial.map((step, index) => ({
    key: `step-${index}`,
    instruction: step.instruction,
    duration: step.durationMinutes ? String(step.durationMinutes) : '',
  }));
}

/**
 * Form dùng chung cho đăng công thức mới và sửa công thức của chính mình. Nguyên liệu có thể liên kết với
 * nguyên liệu chuẩn (gợi ý tìm kiếm) để backend tính dinh dưỡng và kiểm tra chế độ ăn/dị ứng chính xác hơn;
 * các bước nấu được nhập từng bước.
 */
export function RecipeForm({
  initial,
  submitLabel,
  isSubmitting,
  onSubmit,
}: {
  initial?: RecipeFormInitial;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: CreateRecipeInput) => void;
}) {
  const colors = useIconColors();

  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [excerpt, setExcerpt] = React.useState(initial?.excerpt ?? '');
  const [tags, setTags] = React.useState(initial?.tags?.join(', ') ?? '');
  const [categoryId, setCategoryId] = React.useState<string | null>(initial?.categoryId ?? null);
  const [servings, setServings] = React.useState(String(initial?.servings ?? 4));
  const [prepTime, setPrepTime] = React.useState(String(initial?.prepTimeMinutes ?? 15));
  const [cookTime, setCookTime] = React.useState(String(initial?.cookTimeMinutes ?? 20));
  const [difficulty, setDifficulty] = React.useState<RecipeDifficulty>(initial?.difficulty ?? RecipeDifficulty.EASY);
  const [calories, setCalories] = React.useState(initial?.calories ? String(initial.calories) : '');
  const [protein, setProtein] = React.useState(initial?.protein ? String(initial.protein) : '');

  const [ingredients, setIngredients] = React.useState<DraftIngredient[]>(
    (initial?.ingredients ?? []).map((ing, idx) => ({ key: `initial-${idx}`, ...ing }))
  );
  const [ingredient, setIngredient] = React.useState<IngredientPickerValue>({ displayName: '', ingredientId: null });
  const [ingAmount, setIngAmount] = React.useState('');
  const [ingUnit, setIngUnit] = React.useState('');

  const [steps, setSteps] = React.useState<DraftStep[]>(() => toDraftSteps(initial?.steps));

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.RECIPE_GROUP);

  const addIngredient = () => {
    const name = ingredient.displayName.trim();
    const amountNum = Number(ingAmount.replace(',', '.'));
    const unit = ingUnit.trim();
    if (!name || !unit || !Number.isFinite(amountNum) || amountNum <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đủ tên, số lượng (>0) và đơn vị nguyên liệu.');
      return;
    }
    setIngredients((prev) => [
      ...prev,
      { key: `${Date.now()}`, displayName: name, amount: amountNum, unit, ingredientId: ingredient.ingredientId },
    ]);
    setIngredient({ displayName: '', ingredientId: null });
    setIngAmount('');
    setIngUnit('');
  };

  const removeIngredient = (key: string) => {
    setIngredients((prev) => prev.filter((i) => i.key !== key));
  };

  const updateStep = (key: string, patch: Partial<DraftStep>) => {
    setSteps((prev) => prev.map((step) => (step.key === key ? { ...step, ...patch } : step)));
  };

  const submit = () => {
    const cleanTitle = title.trim();
    const validSteps = steps
      .map((step) => ({ instruction: step.instruction.trim(), duration: Number(step.duration) }))
      .filter((step) => step.instruction.length > 0);
    const servingsNum = Math.trunc(Number(servings));
    const prepNum = Math.trunc(Number(prepTime));
    const cookNum = Math.trunc(Number(cookTime));
    const bodyLength = validSteps.reduce((total, step) => total + step.instruction.length, 0);

    if (cleanTitle.length < 3) {
      Alert.alert('Thiếu tiêu đề', 'Tiêu đề công thức cần ít nhất 3 ký tự.');
      return;
    }
    if (validSteps.length === 0 || bodyLength < MIN_BODY_LENGTH) {
      Alert.alert('Thiếu hướng dẫn', `Các bước chế biến cần mô tả ít nhất ${MIN_BODY_LENGTH} ký tự.`);
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert('Thiếu nguyên liệu', 'Vui lòng thêm ít nhất một nguyên liệu.');
      return;
    }
    if (!Number.isFinite(servingsNum) || servingsNum < 1) {
      Alert.alert('Khẩu phần chưa hợp lệ', 'Số khẩu phần phải từ 1 trở lên.');
      return;
    }
    if (!Number.isFinite(prepNum) || prepNum < 0 || !Number.isFinite(cookNum) || cookNum < 0) {
      Alert.alert('Thời gian chưa hợp lệ', 'Thời gian chuẩn bị/nấu phải là số không âm.');
      return;
    }

    onSubmit({
      title: cleanTitle,
      excerpt: excerpt.trim() || undefined,
      categoryIds: categoryId ? [categoryId] : undefined,
      tags: splitTags(tags),
      servings: servingsNum,
      prepTimeMinutes: prepNum,
      cookTimeMinutes: cookNum,
      difficulty,
      nutrition: {
        calories: calories.trim() ? Number(calories) : undefined,
        proteinGrams: protein.trim() ? Number(protein) : undefined,
      },
      ingredients: ingredients.map(({ displayName, amount, unit, ingredientId }) => ({
        displayName,
        amount,
        unit,
        ...(ingredientId ? { ingredientId } : {}),
      })),
      steps: validSteps.map((step) => ({
        instruction: step.instruction,
        ...(Number.isFinite(step.duration) && step.duration > 0 ? { durationMinutes: Math.trunc(step.duration) } : {}),
      })),
    });
  };

  return (
    <View className="gap-5">
      <View className="gap-4">
        <View>
          <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Tên món</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ví dụ: Cơm gạo lứt đậu hũ nhiều rau"
            placeholderTextColor={colors.mutedForeground}
            className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
          />
        </View>

        <View>
          <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Mô tả ngắn</Text>
          <TextInput
            value={excerpt}
            onChangeText={setExcerpt}
            placeholder="Mô tả ngắn hiển thị ở danh sách"
            placeholderTextColor={colors.mutedForeground}
            className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Khẩu phần</Text>
            <TextInput
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
              className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Chuẩn bị (phút)</Text>
            <TextInput
              value={prepTime}
              onChangeText={setPrepTime}
              keyboardType="numeric"
              className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Nấu (phút)</Text>
            <TextInput
              value={cookTime}
              onChangeText={setCookTime}
              keyboardType="numeric"
              className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
            />
          </View>
        </View>

        <View>
          <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Độ khó</Text>
          <View className="flex-row gap-2">
            {DIFFICULTY_OPTIONS.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => setDifficulty(o.value)}
                className={cn(
                  'flex-1 items-center rounded-xl border px-2 py-2.5',
                  difficulty === o.value ? 'border-primary bg-primary/10' : 'border-input'
                )}>
                <Text className={cn('text-sm', difficulty === o.value ? 'font-semibold text-primary' : 'text-foreground')}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Calo (không bắt buộc)</Text>
            <TextInput
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              placeholder="VD: 420"
              placeholderTextColor={colors.mutedForeground}
              className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Đạm (g, không bắt buộc)</Text>
            <TextInput
              value={protein}
              onChangeText={setProtein}
              keyboardType="numeric"
              placeholder="VD: 18"
              placeholderTextColor={colors.mutedForeground}
              className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
            />
          </View>
        </View>

        <View className="gap-2 rounded-2xl border border-dashed border-border p-4">
          <Text className="text-xs font-bold uppercase text-muted-foreground">Nguyên liệu</Text>
          {ingredients.length > 0 ? (
            <View className="gap-1.5">
              {ingredients.map((i) => (
                <View key={i.key} className="flex-row items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                  <View className="flex-1">
                    <Text className="text-xs text-foreground">
                      {i.displayName} — {i.amount} {i.unit}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground">
                      {i.ingredientId ? 'Nguyên liệu chuẩn' : 'Tên tự nhập'}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeIngredient(i.key)}>
                    <Trash2 size={14} color={colors.destructive} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <IngredientPicker placeholder="Tên nguyên liệu" value={ingredient} onChange={setIngredient} />
          <View className="flex-row gap-2">
            <TextInput
              value={ingAmount}
              onChangeText={setIngAmount}
              placeholder="Số lượng"
              keyboardType="numeric"
              placeholderTextColor={colors.mutedForeground}
              className="flex-1 rounded-xl border border-input bg-background px-2.5 py-2.5 text-sm text-foreground"
            />
            <TextInput
              value={ingUnit}
              onChangeText={setIngUnit}
              placeholder="Đơn vị (g, muỗng...)"
              placeholderTextColor={colors.mutedForeground}
              className="flex-1 rounded-xl border border-input bg-background px-2.5 py-2.5 text-sm text-foreground"
            />
          </View>
          <PrimaryButton
            label="Thêm nguyên liệu"
            variant="outline"
            icon={<PlusCircle size={16} color={colors.foreground} />}
            onPress={addIngredient}
          />
        </View>

        <View className="gap-2 rounded-2xl border border-dashed border-border p-4">
          <Text className="text-xs font-bold uppercase text-muted-foreground">Các bước chế biến</Text>
          {steps.map((step, index) => (
            <View key={step.key} className="gap-2 rounded-xl border border-border bg-card p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-foreground">Bước {index + 1}</Text>
                {steps.length > 1 ? (
                  <Pressable onPress={() => setSteps((prev) => prev.filter((item) => item.key !== step.key))}>
                    <Trash2 size={14} color={colors.destructive} />
                  </Pressable>
                ) : null}
              </View>
              <TextInput
                value={step.instruction}
                onChangeText={(value) => updateStep(step.key, { instruction: value })}
                multiline
                placeholder="Mô tả bước này, ví dụ: Phi thơm hành, cho nấm vào xào lửa lớn..."
                placeholderTextColor={colors.mutedForeground}
                textAlignVertical="top"
                className="min-h-20 rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground"
              />
              <TextInput
                value={step.duration}
                onChangeText={(value) => updateStep(step.key, { duration: value })}
                keyboardType="numeric"
                placeholder="Thời gian (phút, không bắt buộc)"
                placeholderTextColor={colors.mutedForeground}
                className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground"
              />
            </View>
          ))}
          <PrimaryButton
            label="Thêm bước"
            variant="outline"
            icon={<PlusCircle size={16} color={colors.foreground} />}
            onPress={() => setSteps((prev) => [...prev, { key: `step-${Date.now()}`, instruction: '', duration: '' }])}
          />
        </View>

        <View>
          <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Tag</Text>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="đậu hũ, bữa tối, nhiều rau"
            placeholderTextColor={colors.mutedForeground}
            className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
          />
        </View>

        <View className="border-t border-border pt-4">
          <Text className="mb-2 text-xs font-bold uppercase text-muted-foreground">Danh mục</Text>
          {isCategoryLoading ? (
            <View className="h-8 rounded-lg bg-muted" />
          ) : isCategoryError ? (
            <Pressable onPress={() => void refetchCategories()}>
              <Text className="text-sm text-primary underline">Không tải được danh mục. Thử lại.</Text>
            </Pressable>
          ) : categoryTree.length === 0 ? (
            <Text className="text-sm text-muted-foreground">Có thể đăng mà không chọn danh mục.</Text>
          ) : (
            <CategoryFilterPills items={categoryTree} selectedId={categoryId} onSelect={setCategoryId} />
          )}
        </View>
      </View>

      <PrimaryButton
        label={isSubmitting ? 'Đang gửi...' : submitLabel}
        loading={isSubmitting}
        icon={<Send size={16} color={colors.primaryForeground} />}
        onPress={submit}
      />
    </View>
  );
}
