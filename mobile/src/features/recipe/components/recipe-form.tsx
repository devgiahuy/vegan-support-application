import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { PlusCircle, Send, Trash2 } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { CategoryType, RecipeDifficulty } from '@/common/enums';
import { CategoryFilterPills } from '@/features/category/components/category-filter-pills';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { IngredientPicker, type IngredientPickerValue } from '@/features/ingredient/components/ingredient-picker';
import { ImagePickerField } from '@/features/storage/components/image-picker-field';
import type { PickedImage } from '@/features/storage/types/storage.model';
import type { CreateRecipeIngredientInput, CreateRecipeInput } from '../api/recipe.api';
import { resolveExactIngredientId } from '@/features/ingredient/utils/ingredient-link';
import type { RecipeDraftSuggestion } from '../types/recipe-draft.model';
import { AiRecipeDraftPanel } from './ai-recipe-draft-panel';
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
  /** Vị trí ban đầu khi sửa công thức; dùng để dịch lại tham chiếu của bước nấu sau khi xóa/thêm nguyên liệu. */
  originalPosition?: number;
}

/** Các trường của bước nấu mà form di động chưa cho nhập nhưng phải giữ nguyên khi sửa. */
interface PreservedStepFields {
  cookingMethodId?: string | null;
  temperatureCelsius?: number | null;
  affectedIngredientPositions?: number[];
}

interface DraftStep extends PreservedStepFields {
  key: string;
  instruction: string;
  duration: string;
}

/** Các chỉ số dinh dưỡng form chưa cho nhập, được giữ nguyên khi sửa để không bị xóa khỏi bản mới. */
export interface PreservedNutrition {
  carbsGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  vitaminB12Mcg?: number;
}

export interface RecipeFormInitial {
  title?: string;
  excerpt?: string;
  /** Ảnh bìa hiện có (chỉ để xem trước khi sửa). */
  coverImageUrl?: string | null;
  tags?: string[];
  categoryId?: string | null;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: RecipeDifficulty;
  calories?: number;
  protein?: number;
  preservedNutrition?: PreservedNutrition;
  ingredients?: {
    displayName: string;
    amount: number;
    unit: string;
    ingredientId?: string | null;
    optional?: boolean;
    position?: number;
  }[];
  steps?: ({ instruction: string; durationMinutes?: number | null } & PreservedStepFields)[];
}

function toDraftSteps(initial: RecipeFormInitial['steps']): DraftStep[] {
  if (!initial || initial.length === 0) return [{ key: 'step-0', instruction: '', duration: '' }];
  return initial.map((step, index) => ({
    key: `step-${index}`,
    instruction: step.instruction,
    duration: step.durationMinutes ? String(step.durationMinutes) : '',
    cookingMethodId: step.cookingMethodId ?? null,
    temperatureCelsius: step.temperatureCelsius ?? null,
    affectedIngredientPositions: step.affectedIngredientPositions ?? [],
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
  const keySeq = React.useRef(0);
  const nextKey = (prefix: string) => `${prefix}-new-${++keySeq.current}`;

  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [excerpt, setExcerpt] = React.useState(initial?.excerpt ?? '');
  const [cover, setCover] = React.useState<PickedImage | null>(null);
  const [coverBusy, setCoverBusy] = React.useState(false);
  const [tags, setTags] = React.useState(initial?.tags?.join(', ') ?? '');
  const [categoryId, setCategoryId] = React.useState<string | null>(initial?.categoryId ?? null);
  const [servings, setServings] = React.useState(String(initial?.servings ?? 4));
  const [prepTime, setPrepTime] = React.useState(String(initial?.prepTimeMinutes ?? 15));
  const [cookTime, setCookTime] = React.useState(String(initial?.cookTimeMinutes ?? 20));
  const [difficulty, setDifficulty] = React.useState<RecipeDifficulty>(initial?.difficulty ?? RecipeDifficulty.EASY);
  const [calories, setCalories] = React.useState(initial?.calories ? String(initial.calories) : '');
  const [protein, setProtein] = React.useState(initial?.protein ? String(initial.protein) : '');

  const [ingredients, setIngredients] = React.useState<DraftIngredient[]>(
    (initial?.ingredients ?? []).map(({ position, ...ing }, idx) => ({
      key: `initial-${idx}`,
      ...ing,
      originalPosition: position ?? idx,
    }))
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
    const key = nextKey('ing');
    setIngredients((prev) => [
      ...prev,
      { key, displayName: name, amount: amountNum, unit, ingredientId: ingredient.ingredientId },
    ]);
    if (!ingredient.ingredientId) void autoLinkIngredient(key, name);
    setIngredient({ displayName: '', ingredientId: null });
    setIngAmount('');
    setIngUnit('');
  };

  /** Tên tự nhập khớp đúng một nguyên liệu chuẩn thì tự gắn `ingredientId` để BE tính dinh dưỡng/kiểm tra dị ứng. */
  const autoLinkIngredient = async (key: string, name: string) => {
    const ingredientId = await resolveExactIngredientId(name);
    if (!ingredientId) return;
    setIngredients((prev) =>
      prev.map((item) => (item.key === key && !item.ingredientId && item.displayName === name ? { ...item, ingredientId } : item))
    );
  };

  const applyDraft = (draft: RecipeDraftSuggestion) => {
    const stamp = nextKey('ai');
    const drafted = draft.ingredients.map((item, index) => ({
      key: `ai-${stamp}-${index}`,
      displayName: item.name,
      amount: item.amount,
      unit: item.unit,
      ...(item.optional ? { optional: true } : {}),
      ingredientId: null,
      // Vị trí AI dùng để tham chiếu nguyên liệu trong bước nấu, giữ nguyên khi người dùng chưa đổi thứ tự.
      originalPosition: index,
    }));
    const run = () => {
      setServings(String(draft.servings));
      setPrepTime(String(draft.prepTimeMinutes));
      setCookTime(String(draft.cookTimeMinutes));
      setDifficulty(draft.difficulty);
      setIngredients(drafted);
      setSteps(
        draft.steps.map((step, index) => ({
          key: `ai-step-${stamp}-${index}`,
          instruction: step.instruction,
          duration: step.durationMinutes ? String(step.durationMinutes) : '',
          affectedIngredientPositions: step.affectedIngredientPositions.filter((position) => position < drafted.length),
        }))
      );
      drafted.forEach((item) => void autoLinkIngredient(item.key, item.displayName));
    };
    const hasContent = ingredients.length > 0 || steps.some((step) => step.instruction.trim().length > 0);
    if (!hasContent) return run();
    Alert.alert('Thay nội dung hiện có?', 'Nguyên liệu, các bước, khẩu phần và thời gian hiện tại sẽ được thay bằng bản nháp AI.', [
      { text: 'Giữ nguyên', style: 'cancel' },
      { text: 'Thay bằng bản nháp', style: 'destructive', onPress: run },
    ]);
  };

  const removeIngredient = (key: string) => {
    setIngredients((prev) => prev.filter((i) => i.key !== key));
  };

  const updateStep = (key: string, patch: Partial<DraftStep>) => {
    setSteps((prev) => prev.map((step) => (step.key === key ? { ...step, ...patch } : step)));
  };

  const submit = () => {
    if (coverBusy) {
      Alert.alert('Ảnh đang tải lên', 'Vui lòng đợi ảnh bìa tải xong rồi gửi công thức.');
      return;
    }
    const cleanTitle = title.trim();
    const validSteps = steps
      .map((step) => ({
        instruction: step.instruction.trim(),
        duration: Number(step.duration),
        cookingMethodId: step.cookingMethodId,
        temperatureCelsius: step.temperatureCelsius,
        affectedIngredientPositions: step.affectedIngredientPositions ?? [],
      }))
      .filter((step) => step.instruction.length > 0);
    // Nguyên liệu bị xóa/thêm làm đổi vị trí: dịch lại tham chiếu của bước nấu, bỏ tham chiếu tới nguyên liệu đã xóa.
    const positionMap = new Map<number, number>();
    ingredients.forEach((ing, index) => {
      if (ing.originalPosition !== undefined) positionMap.set(ing.originalPosition, index);
    });
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
      ...(cover ? { coverAssetId: cover.assetId } : {}),
      categoryIds: categoryId ? [categoryId] : undefined,
      tags: splitTags(tags),
      servings: servingsNum,
      prepTimeMinutes: prepNum,
      cookTimeMinutes: cookNum,
      difficulty,
      nutrition: {
        calories: calories.trim() ? Number(calories) : undefined,
        proteinGrams: protein.trim() ? Number(protein) : undefined,
        ...initial?.preservedNutrition,
      },
      ingredients: ingredients.map(({ displayName, amount, unit, ingredientId, optional }) => ({
        displayName,
        amount,
        unit,
        ...(ingredientId ? { ingredientId } : {}),
        ...(optional ? { optional: true } : {}),
      })),
      steps: validSteps.map((step) => {
        const affected = step.affectedIngredientPositions
          .map((position) => positionMap.get(position))
          .filter((position): position is number => position !== undefined);
        return {
          instruction: step.instruction,
          ...(Number.isFinite(step.duration) && step.duration > 0 ? { durationMinutes: Math.trunc(step.duration) } : {}),
          ...(step.cookingMethodId ? { cookingMethodId: step.cookingMethodId } : {}),
          ...(typeof step.temperatureCelsius === 'number' ? { temperatureCelsius: step.temperatureCelsius } : {}),
          ...(affected.length > 0 ? { affectedIngredientPositions: affected } : {}),
        };
      }),
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

        <ImagePickerField
          label="Ảnh bìa món ăn"
          value={cover}
          onChange={setCover}
          onBusyChange={setCoverBusy}
          existingUrl={initial?.coverImageUrl}
          existingNote={"Chọn ảnh mới để thay. Nếu không chọn, bản chỉnh sửa sẽ không có ảnh bìa vì API chưa cho giữ lại ảnh cũ."}
        />

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

        <AiRecipeDraftPanel
          title={title}
          excerpt={excerpt}
          existingIngredientNames={ingredients.map((item) => item.displayName)}
          onApply={applyDraft}
        />

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
        disabled={coverBusy}
        icon={<Send size={16} color={colors.primaryForeground} />}
        onPress={submit}
      />
    </View>
  );
}
