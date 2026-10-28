import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react-native';

import { DropdownField, type DropdownOption } from '@/components/ui/dropdown-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { RecipeDifficulty } from '@/common/enums';
import { ImagePickerField } from '@/features/storage/components/image-picker-field';
import type { PickedImage } from '@/features/storage/types/storage.model';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { DIFFICULTY_OPTIONS, type EditorIngredient, type EditorStep, type RecipeEditorValues } from '../utils/recipe-editor';
import { RecipeIngredientRow } from './recipe-ingredient-row';

type ErrorOf = (path: string) => string | undefined;

function FieldError({ message }: { message?: string }) {
  return message ? <Text accessibilityRole="alert" className="mt-1 text-xs text-destructive">{message}</Text> : null;
}

/** Bước 1 — Tên món, mô tả, khẩu phần, thời gian, ảnh bìa. */
export function BasicsSection({
  values,
  errorOf,
  onPatch,
  cover,
  onCoverChange,
  onCoverBusyChange,
  existingCoverUrl,
}: {
  values: RecipeEditorValues;
  errorOf: ErrorOf;
  onPatch: (patch: Partial<RecipeEditorValues>) => void;
  cover: PickedImage | null;
  onCoverChange: (cover: PickedImage | null) => void;
  onCoverBusyChange: (busy: boolean) => void;
  existingCoverUrl?: string | null;
}) {
  return (
    <View className="gap-4">
      <TextField
        label="Tên món *"
        labelVariant="plain"
        value={values.title}
        onChangeText={(title) => onPatch({ title })}
        placeholder="Ví dụ: Đậu hũ sốt nấm đông cô"
        error={errorOf('title')}
        maxLength={200}
      />

      <View>
        <TextField
          label="Mô tả ngắn"
          labelVariant="plain"
          value={values.description}
          onChangeText={(description) => onPatch({ description })}
          placeholder="Hương vị, dịp phù hợp hoặc lý do bạn yêu món này"
          multiline
          textAlignVertical="top"
          className="min-h-24 pt-3"
          error={errorOf('description')}
        />
        <Text className="mt-1 self-end text-xs text-muted-foreground">{values.description.length}/500</Text>
      </View>

      <View className="flex-row gap-3">
        {(
          [
            ['servings', 'servings', 'Khẩu phần *', 'VD: 4'],
            ['prepTime', 'prepTimeMinutes', 'Sơ chế (phút) *', 'VD: 15'],
            ['cookTime', 'cookTimeMinutes', 'Nấu (phút) *', 'VD: 25'],
          ] as const
        ).map(([key, path, label, placeholder]) => (
          <View key={key} className="flex-1">
            <TextField
              label={label}
              labelVariant="plain"
              value={values[key]}
              onChangeText={(text) => onPatch({ [key]: text.replace(/[^0-9]/g, '') })}
              keyboardType="number-pad"
              placeholder={placeholder}
              error={errorOf(path)}
            />
          </View>
        ))}
      </View>

      <View className="gap-1">
        <ImagePickerField
          label="Ảnh bìa món ăn"
          value={cover}
          onChange={onCoverChange}
          onBusyChange={onCoverBusyChange}
          existingUrl={existingCoverUrl}
          existingNote="Chọn ảnh mới để thay. Nếu không chọn, bản chỉnh sửa sẽ không có ảnh bìa vì API chưa cho giữ lại ảnh cũ."
        />
        <Text className="text-xs text-muted-foreground">Khuyến khích. Ảnh thành phẩm giúp công thức nổi bật trong kho.</Text>
      </View>
    </View>
  );
}

/** Bước 2 — Danh sách nguyên liệu (khung AI nằm phía trên, do màn hình truyền vào). */
export function IngredientsSection({
  ingredients,
  errorOf,
  onChangeIngredient,
  onRemoveIngredient,
  onAddIngredient,
  assistant,
}: {
  ingredients: EditorIngredient[];
  errorOf: ErrorOf;
  onChangeIngredient: (key: string, patch: Partial<EditorIngredient>) => void;
  onRemoveIngredient: (key: string) => void;
  onAddIngredient: () => void;
  assistant?: React.ReactNode;
}) {
  const colors = useIconColors();
  return (
    <View className="gap-4">
      {assistant}
      <View className="gap-3">
        {ingredients.map((ingredient, index) => (
          <RecipeIngredientRow
            key={ingredient.key}
            index={index}
            ingredient={ingredient}
            canRemove={ingredients.length > 1}
            errors={{
              name: errorOf(`ingredients.${index}.name`),
              amount: errorOf(`ingredients.${index}.amount`),
              unit: errorOf(`ingredients.${index}.unit`),
            }}
            onChange={(patch) => onChangeIngredient(ingredient.key, patch)}
            onRemove={() => onRemoveIngredient(ingredient.key)}
          />
        ))}
      </View>
      <FieldError message={errorOf('ingredients')} />
      <PrimaryButton label="Thêm nguyên liệu" variant="outline" icon={<Plus size={16} color={colors.foreground} />} onPress={onAddIngredient} />
    </View>
  );
}

/** Bước 3 — Các bước nấu, mỗi bước một ô; có lên/xuống/xóa. */
export function StepsSection({
  steps,
  errorOf,
  onChangeStep,
  onMoveStep,
  onRemoveStep,
  onAddStep,
}: {
  steps: EditorStep[];
  errorOf: ErrorOf;
  onChangeStep: (key: string, instruction: string) => void;
  onMoveStep: (key: string, offset: -1 | 1) => void;
  onRemoveStep: (key: string) => void;
  onAddStep: () => void;
}) {
  const colors = useIconColors();
  return (
    <View className="gap-4">
      <View className="gap-3">
        {steps.map((step, index) => {
          const error = errorOf(`steps.${index}.instruction`);
          return (
            <View key={step.key} className={cn('flex-row gap-3 rounded-xl border bg-card p-3', error ? 'border-destructive/60' : 'border-border')}>
              <View className="mt-1.5 size-6 items-center justify-center rounded-full bg-primary">
                <Text className="text-xs font-semibold text-primary-foreground">{index + 1}</Text>
              </View>
              <View className="flex-1">
                <TextInput
                  accessibilityLabel={`Bước ${index + 1}`}
                  value={step.instruction}
                  onChangeText={(text) => onChangeStep(step.key, text)}
                  multiline
                  textAlignVertical="top"
                  placeholder={index === 0 ? 'Ví dụ: Rửa sạch nấm, cắt miếng vừa ăn rồi để ráo.' : `Mô tả bước ${index + 1}`}
                  placeholderTextColor={colors.mutedForeground}
                  className="min-h-20 rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-5 text-foreground"
                />
                <FieldError message={error} />
              </View>
              <View className="gap-1">
                <Pressable accessibilityRole="button" accessibilityLabel={`Đưa bước ${index + 1} lên trên`} disabled={index === 0} onPress={() => onMoveStep(step.key, -1)} className={cn('size-8 items-center justify-center', index === 0 && 'opacity-30')}>
                  <ArrowUp size={16} color={colors.mutedForeground} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Đưa bước ${index + 1} xuống dưới`} disabled={index === steps.length - 1} onPress={() => onMoveStep(step.key, 1)} className={cn('size-8 items-center justify-center', index === steps.length - 1 && 'opacity-30')}>
                  <ArrowDown size={16} color={colors.mutedForeground} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Xóa bước ${index + 1}`} disabled={steps.length <= 1} onPress={() => onRemoveStep(step.key)} className={cn('size-8 items-center justify-center', steps.length <= 1 && 'opacity-30')}>
                  <Trash2 size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
      <FieldError message={errorOf('steps')} />
      <PrimaryButton label="Thêm bước" variant="outline" icon={<Plus size={16} color={colors.foreground} />} onPress={onAddStep} />
    </View>
  );
}

/** Bước 4 — Danh mục (bắt buộc), độ khó và ghi chú dinh dưỡng tự động. */
export function ClassifySection({
  categoryId,
  categoryOptions,
  categoryStatus,
  onRetryCategories,
  difficulty,
  error,
  onCategoryChange,
  onDifficultyChange,
}: {
  categoryId: string | null;
  categoryOptions: DropdownOption<string | null>[];
  categoryStatus?: 'loading' | 'error';
  onRetryCategories: () => void;
  difficulty: RecipeDifficulty;
  error?: string;
  onCategoryChange: (id: string | null) => void;
  onDifficultyChange: (difficulty: RecipeDifficulty) => void;
}) {
  return (
    <View className="gap-5">
      <View>
        <DropdownField
          variant="field"
          label="Danh mục món *"
          value={categoryId}
          options={categoryOptions}
          onChange={onCategoryChange}
          status={categoryStatus}
          onRetry={onRetryCategories}
        />
        <FieldError message={error} />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Độ khó</Text>
        <View className="gap-2">
          {DIFFICULTY_OPTIONS.map((option) => {
            const selected = difficulty === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => onDifficultyChange(option.value)}
                className={cn('flex-row items-start gap-3 rounded-xl border p-3', selected ? 'border-primary bg-primary/5' : 'border-input bg-background')}>
                <View className={cn('mt-0.5 size-4 items-center justify-center rounded-full border', selected ? 'border-primary' : 'border-input')}>
                  {selected ? <View className="size-2 rounded-full bg-primary" /> : null}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{option.label}</Text>
                  <Text className="text-xs text-muted-foreground">{option.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-1 rounded-xl border border-border bg-muted/30 p-4">
        <Text className="text-sm font-medium text-foreground">Dinh dưỡng được tính tự động</Text>
        <Text className="text-xs leading-5 text-muted-foreground">
          Sau khi lưu, hệ thống đối chiếu nguyên liệu đã liên kết để ước tính năng lượng, vi chất và cảnh báo dị ứng. Bạn không cần nhập tay.
        </Text>
      </View>
    </View>
  );
}
