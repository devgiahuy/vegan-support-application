import * as React from 'react';
import { Alert, Text, View } from 'react-native';
import { ArrowLeft, ArrowRight, CircleAlert, Send } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { CategoryType } from '@/common/enums';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { buildCategoryOptions } from '@/features/category/utils/category-options';
import type { PickedImage } from '@/features/storage/types/storage.model';
import { getApiErrorCode } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import type { CreateRecipeInput } from '../api/recipe.api';
import type { RecipeDraftSuggestion } from '../types/recipe-draft.model';
import {
  CONTENT_STEPS,
  RECIPE_EDITOR_STEPS,
  buildRecipeInput,
  emptyIngredient,
  emptyStep,
  hasUserContent,
  issueLocation,
  stepTitle,
  toEditorValues,
  validateRecipeEditor,
  type EditorIngredient,
  type RecipeContentStep,
  type RecipeEditorStep,
  type RecipeEditorValues,
  type RecipeFieldIssue,
  type RecipeFormInitial,
} from '../utils/recipe-editor';
import { getContentErrorMessage } from '../utils/recipe-errors';
import { AiRecipeDraftPanel } from './ai-recipe-draft-panel';
import { RecipeEditorReview } from './recipe-editor-review';
import { BasicsSection, ClassifySection, IngredientsSection, StepsSection } from './recipe-editor-sections';
import { RecipeEditorStepper } from './recipe-editor-stepper';

export type { RecipeFormInitial } from '../utils/recipe-editor';

const INGREDIENT_ERROR_CODES = new Set(['INGREDIENT_ID_NAME_MISMATCH', 'INVALID_INGREDIENT_REFERENCE']);

/**
 * Form công thức 5 bước dùng chung cho đăng mới và sửa — đồng bộ `recipe-editor-form.tsx` của web:
 * Thông tin cơ bản → Nguyên liệu → Các bước nấu → Phân loại → Xem lại & gửi. Bấm "Tiếp" kiểm tra riêng từng bước.
 * Trợ lý AI chỉ có khi tạo mới (`enableAi`). `onSubmit` nên ném lỗi khi lưu thất bại để form đưa người dùng về đúng bước.
 */
export function RecipeForm({
  initial,
  submitLabel,
  isSubmitting,
  onSubmit,
  enableAi = false,
  onStepChange,
}: {
  initial?: RecipeFormInitial;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (input: CreateRecipeInput) => Promise<void> | void;
  enableAi?: boolean;
  /** Gọi khi đổi bước để màn hình cuộn lên đầu form. */
  onStepChange?: () => void;
}) {
  const colors = useIconColors();
  const keySeq = React.useRef(0);
  const nextKey = (prefix: string) => `${prefix}-new-${++keySeq.current}`;

  const [step, setStep] = React.useState<RecipeEditorStep>('basics');
  const [values, setValues] = React.useState<RecipeEditorValues>(() => toEditorValues(initial));
  const [attempted, setAttempted] = React.useState<ReadonlySet<RecipeContentStep>>(new Set());
  const [notice, setNotice] = React.useState('');
  const [submitError, setSubmitError] = React.useState('');
  const [cover, setCover] = React.useState<PickedImage | null>(null);
  const [coverBusy, setCoverBusy] = React.useState(false);

  const categoryQuery = useCategoryTreeQuery(CategoryType.RECIPE_GROUP);
  const categoryOptions = React.useMemo(() => buildCategoryOptions(categoryQuery.data ?? [], 'Chọn danh mục'), [categoryQuery.data]);
  const categoryName = values.categoryId ? categoryOptions.find((option) => option.value === values.categoryId)?.label : undefined;

  const issues = React.useMemo(() => validateRecipeEditor(values), [values]);
  const visibleIssues = issues.filter((issue) => attempted.has(issue.step));
  const errorOf = (path: string) => visibleIssues.find((issue) => issue.path === path)?.message;

  const stepIndex = RECIPE_EDITOR_STEPS.findIndex((item) => item.id === step);
  const current = RECIPE_EDITOR_STEPS[stepIndex]!;
  const next = RECIPE_EDITOR_STEPS[stepIndex + 1];
  const prev = RECIPE_EDITOR_STEPS[stepIndex - 1];

  const patch = (change: Partial<RecipeEditorValues>) => setValues((previous) => ({ ...previous, ...change }));
  const changeIngredient = React.useCallback(
    (key: string, change: Partial<EditorIngredient>) =>
      setValues((previous) => ({
        ...previous,
        ingredients: previous.ingredients.map((item) => (item.key === key ? { ...item, ...change } : item)),
      })),
    []
  );

  const goTo = (target: RecipeEditorStep) => {
    setStep(target);
    setNotice('');
    onStepChange?.();
  };

  const markAttempted = (steps: RecipeContentStep[]) => setAttempted((previous) => new Set([...previous, ...steps]));

  const describe = (list: RecipeFieldIssue[]) => {
    const first = list[0];
    if (!first) return '';
    const location = issueLocation(first.path);
    return `${stepTitle(first.step)}${location ? ` · ${location}` : ''}: ${first.message}${list.length > 1 ? ` (và ${list.length - 1} mục khác)` : ''}`;
  };

  const handleNext = () => {
    if (step === 'review' || !next) return;
    const stepIssues = issues.filter((issue) => issue.step === step);
    if (stepIssues.length > 0) {
      markAttempted([step as RecipeContentStep]);
      setNotice(`Bước "${current.title}" còn thiếu thông tin — ${describe(stepIssues)}`);
      return;
    }
    goTo(next.id);
  };

  const fixIssue = (issue: RecipeFieldIssue) => {
    markAttempted([issue.step]);
    goTo(issue.step);
  };

  const handleSubmit = async () => {
    setSubmitError('');
    markAttempted(CONTENT_STEPS.map((item) => item.id));
    if (issues.length > 0) {
      setNotice(`Công thức còn thiếu thông tin bắt buộc — ${describe(issues)}`);
      return;
    }
    if (coverBusy) {
      Alert.alert('Ảnh đang tải lên', 'Vui lòng đợi ảnh bìa tải xong rồi gửi công thức.');
      return;
    }
    try {
      await onSubmit(buildRecipeInput(values, { coverAssetId: cover?.assetId, tags: initial?.tags }));
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code && INGREDIENT_ERROR_CODES.has(code)) {
        setSubmitError('Một số nguyên liệu không khớp danh mục chuẩn. Hãy gõ lại tên và chọn từ gợi ý.');
        goTo('ingredients');
        return;
      }
      setSubmitError(getContentErrorMessage(error, 'Không thể lưu công thức. Vui lòng thử lại.'));
    }
  };

  const applyDraft = (draft: RecipeDraftSuggestion) => {
    const stamp = nextKey('ai');
    const ingredients: EditorIngredient[] = draft.ingredients.map((item, index) => ({
      key: `${stamp}-ing-${index}`,
      ingredientId: null,
      name: item.name,
      amount: String(item.amount),
      unit: item.unit,
      ...(item.optional ? { optional: true } : {}),
      // Vị trí AI dùng để tham chiếu nguyên liệu trong bước nấu.
      originalPosition: index,
    }));
    const run = () => {
      // Tên món và mô tả là đầu vào của AI nên giữ bản người dùng đã nhập; danh mục không do AI điền.
      patch({
        servings: String(draft.servings),
        prepTime: String(draft.prepTimeMinutes),
        cookTime: String(draft.cookTimeMinutes),
        difficulty: draft.difficulty,
        ingredients,
        steps: draft.steps.map((item, index) => ({
          key: `${stamp}-step-${index}`,
          instruction: item.instruction,
          durationMinutes: item.durationMinutes,
          affectedIngredientPositions: item.affectedIngredientPositions.filter((position) => position < ingredients.length),
        })),
      });
      setSubmitError('');
      Alert.alert('Đã điền gợi ý AI', 'Đã điền nguyên liệu và các bước nấu. Kiểm tra lại định lượng, liên kết nguyên liệu chuẩn rồi chọn danh mục.');
    };
    if (!hasUserContent(values)) return run();
    Alert.alert('Thay nội dung hiện có?', 'Nguyên liệu, các bước, khẩu phần và thời gian hiện tại sẽ được thay bằng bản nháp AI. Tên món và mô tả của bạn được giữ nguyên.', [
      { text: 'Giữ nguyên', style: 'cancel' },
      { text: 'Thay bằng bản nháp', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <View className="gap-5">
      <RecipeEditorStepper current={step} issues={issues} attempted={attempted} disabled={isSubmitting} onSelect={goTo} />

      <View className="gap-5 rounded-2xl border border-border bg-card p-4">
        <View className="gap-1">
          <Text className="text-lg font-bold text-foreground">{current.title}</Text>
          <Text className="text-sm leading-5 text-muted-foreground">{current.description}</Text>
        </View>

        {submitError ? (
          <View className="flex-row items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
            <CircleAlert size={16} color={colors.destructive} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-destructive">Chưa lưu được công thức</Text>
              <Text accessibilityRole="alert" className="mt-0.5 text-xs leading-5 text-destructive">{submitError}</Text>
            </View>
          </View>
        ) : null}
        {notice ? (
          <View className="flex-row items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
            <CircleAlert size={16} color={colors.destructive} />
            <Text accessibilityRole="alert" className="flex-1 text-xs leading-5 text-destructive">{notice}</Text>
          </View>
        ) : null}

        {/* Luôn giữ mounted (chỉ ẩn khi sang bước khác): ô chọn ảnh giữ tiến trình tải lên và tự báo `coverBusy` về
            false khi xong. Gỡ nó khi đổi bước làm `coverBusy` kẹt ở true nếu ảnh đang tải → không gửi được công thức. */}
        <View className={step === 'basics' ? '' : 'hidden'}>
          <BasicsSection
            values={values}
            errorOf={errorOf}
            onPatch={patch}
            cover={cover}
            onCoverChange={setCover}
            onCoverBusyChange={setCoverBusy}
            existingCoverUrl={initial?.coverImageUrl}
          />
        </View>

        {step === 'ingredients' ? (
          <IngredientsSection
            ingredients={values.ingredients}
            errorOf={errorOf}
            onChangeIngredient={changeIngredient}
            onRemoveIngredient={(key) => setValues((previous) => ({ ...previous, ingredients: previous.ingredients.filter((item) => item.key !== key) }))}
            onAddIngredient={() => setValues((previous) => ({ ...previous, ingredients: [...previous.ingredients, emptyIngredient(nextKey('ing'))] }))}
            assistant={
              enableAi ? (
                <AiRecipeDraftPanel
                  seed={{
                    title: values.title,
                    description: values.description,
                    ingredientNames: values.ingredients.map((item) => item.name.trim()).filter(Boolean),
                  }}
                  onApply={applyDraft}
                  onEditBasics={() => goTo('basics')}
                />
              ) : undefined
            }
          />
        ) : null}

        {step === 'steps' ? (
          <StepsSection
            steps={values.steps}
            errorOf={errorOf}
            onChangeStep={(key, instruction) => setValues((previous) => ({ ...previous, steps: previous.steps.map((item) => (item.key === key ? { ...item, instruction } : item)) }))}
            onMoveStep={(key, offset) =>
              setValues((previous) => {
                const index = previous.steps.findIndex((item) => item.key === key);
                const target = index + offset;
                if (index < 0 || target < 0 || target >= previous.steps.length) return previous;
                const steps = [...previous.steps];
                [steps[index], steps[target]] = [steps[target]!, steps[index]!];
                return { ...previous, steps };
              })
            }
            onRemoveStep={(key) => setValues((previous) => ({ ...previous, steps: previous.steps.filter((item) => item.key !== key) }))}
            onAddStep={() => setValues((previous) => ({ ...previous, steps: [...previous.steps, emptyStep(nextKey('step'))] }))}
          />
        ) : null}

        {step === 'classify' ? (
          <ClassifySection
            categoryId={values.categoryId}
            categoryOptions={categoryOptions}
            categoryStatus={categoryQuery.isLoading ? 'loading' : categoryQuery.isError ? 'error' : undefined}
            onRetryCategories={() => void categoryQuery.refetch()}
            difficulty={values.difficulty}
            error={errorOf('categoryId')}
            onCategoryChange={(categoryId) => patch({ categoryId })}
            onDifficultyChange={(difficulty) => patch({ difficulty })}
          />
        ) : null}

        {step === 'review' ? (
          <RecipeEditorReview
            values={values}
            issues={issues}
            categoryName={categoryName}
            coverUrl={cover?.url ?? initial?.coverImageUrl ?? null}
            onEdit={(target) => goTo(target)}
            onFixIssue={fixIssue}
          />
        ) : null}

        <View className="gap-2 border-t border-border pt-4">
          {step === 'review' ? (
            <PrimaryButton
              label={isSubmitting ? 'Đang gửi…' : submitLabel}
              loading={isSubmitting}
              disabled={isSubmitting}
              icon={<Send size={16} color={colors.primaryForeground} />}
              onPress={() => void handleSubmit()}
            />
          ) : (
            <PrimaryButton
              label={`Tiếp: ${next?.title ?? ''}`}
              icon={<ArrowRight size={16} color={colors.primaryForeground} />}
              onPress={handleNext}
            />
          )}
          {prev ? (
            <PrimaryButton
              label={`Quay lại: ${prev.title}`}
              variant="outline"
              disabled={isSubmitting}
              icon={<ArrowLeft size={16} color={colors.foreground} />}
              onPress={() => goTo(prev.id)}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
