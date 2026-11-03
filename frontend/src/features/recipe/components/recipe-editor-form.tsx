'use client';

import * as React from 'react';
import { useForm, useFieldArray, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Eye,
  Loader2,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CategoryType, RecipeDifficulty, UserRole } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { flattenCategories } from '@/features/category/utils/flatten-categories';
import { ImageUploader } from '@/features/post/components/image-uploader';
import { RecipeNutritionPreviewDrawer } from '@/features/recipe-nutrition/components/recipe-nutrition-preview-drawer';
import {
  buildRecipeFormSchema,
  RECIPE_NUTRITION_FIELDS,
  type RecipeFormValues,
} from '../schemas/recipe-form.schema';
import type { AiRecipeDraftSeed } from './ai-recipe-draft-assistant';
import { RecipeIngredientRow } from './recipe-ingredient-row';
import {
  DIFFICULTY_OPTIONS,
  RecipeEditorProgress,
  RecipeEditorReview,
} from './recipe-editor-review';
import {
  RECIPE_EDITOR_STEPS,
  STEP_FIELDS,
  collectFieldIssues,
  fieldDomId,
  issueLocation,
  issuesFromValues,
  stepTitle,
  type RecipeContentStep,
  type RecipeEditorStep,
  type RecipeFieldIssue,
} from './recipe-editor-steps';

export interface RecipeEditorFormHandle {
  setDraftValues: (values: Partial<RecipeFormValues>) => void;
  isDirty: () => boolean;
  /** Đã có nguyên liệu hoặc bước nấu do người dùng nhập (bản nháp AI sẽ ghi đè các phần này). */
  hasUserContent: () => boolean;
}

interface RecipeEditorFormProps {
  postId?: string;
  initialValues?: Partial<RecipeFormValues>;
  /** Ném lỗi khi lưu thất bại để form đưa người dùng về đúng bước cần sửa. */
  onSubmit: (values: RecipeFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  /** Tên form cho trình đọc màn hình. */
  formTitle?: string;
  submitLabel?: string;
  /** Slot trợ lý AI ở bước Nguyên liệu (chỉ trang tạo mới dùng). */
  renderAssistant?: (
    seed: AiRecipeDraftSeed,
    actions: { editBasics: () => void }
  ) => React.ReactNode;
}

const EMPTY_INGREDIENT = {
  name: '',
  ingredientId: null,
  amount: Number.NaN,
  unit: '',
};

const INGREDIENT_ERROR_CODES = new Set([
  'INGREDIENT_ID_NAME_MISMATCH',
  'INVALID_INGREDIENT_REFERENCE',
]);

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const RecipeEditorForm = React.forwardRef<RecipeEditorFormHandle, RecipeEditorFormProps>(
  function RecipeEditorForm(
    {
      postId,
      initialValues,
      onSubmit,
      isSubmitting = false,
      formTitle = 'Biểu mẫu công thức món chay',
      submitLabel = 'Gửi công thức để duyệt',
      renderAssistant,
    }: RecipeEditorFormProps,
    ref
  ) {
    const [step, setStep] = React.useState<RecipeEditorStep>('basics');
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [previewDrawerOpen, setPreviewDrawerOpen] = React.useState(false);
    const topRef = React.useRef<HTMLDivElement>(null);

    const categoryQuery = useCategoryTreeQuery(CategoryType.RECIPE_GROUP);
    const flatCategories = React.useMemo(
      () => flattenCategories(categoryQuery.data ?? []),
      [categoryQuery.data]
    );

    // Contributor/Admin: 6 chỉ số bắt buộc và công thức xuất bản ngay khi đăng (backend kiểm tra lại role).
    const userRole = useAuthStore((state) => state.user?.role);
    const requireNutrition = userRole === UserRole.ADMIN || userRole === UserRole.CONTRIBUTOR;
    const formSchema = React.useMemo(
      () => buildRecipeFormSchema({ requireNutrition }),
      [requireNutrition]
    );

    const form = useForm<RecipeFormValues>({
      resolver: zodResolver(formSchema),
      shouldFocusError: false,
      defaultValues: {
        title: initialValues?.title || '',
        categoryId: initialValues?.categoryId || '',
        coverImageUrl: initialValues?.coverImageUrl || '',
        coverMedia: initialValues?.coverMedia ?? null,
        difficulty: initialValues?.difficulty || RecipeDifficulty.MEDIUM,
        servings: initialValues?.servings ?? Number.NaN,
        prepTimeMinutes: initialValues?.prepTimeMinutes ?? Number.NaN,
        cookTimeMinutes: initialValues?.cookTimeMinutes ?? Number.NaN,
        description: initialValues?.description || '',
        ingredients: initialValues?.ingredients?.length
          ? initialValues.ingredients
          : [EMPTY_INGREDIENT],
        steps: initialValues?.steps?.length
          ? initialValues.steps
          : [{ stepNumber: 1, instruction: '' }],
        nutrition: initialValues?.nutrition ?? {},
      },
    });

    const {
      fields: ingredientFields,
      append: appendIngredient,
      remove: removeIngredient,
    } = useFieldArray({ control: form.control, name: 'ingredients' });

    const {
      fields: stepFields,
      append: appendStep,
      remove: removeStep,
      move: moveStep,
    } = useFieldArray({ control: form.control, name: 'steps' });

    React.useImperativeHandle(ref, () => ({
      setDraftValues: (values: Partial<RecipeFormValues>) => {
        const current = form.getValues();
        // Tên món và mô tả là đầu vào của AI — giữ bản người dùng đã nhập.
        form.reset(
          {
            ...current,
            ...values,
            title: current.title?.trim() ? current.title : (values.title ?? ''),
            description: current.description?.trim()
              ? current.description
              : (values.description ?? ''),
            // Khẩu phần và thời gian người dùng đã nhập ở bước 1 không bị bản nháp AI ghi đè;
            // AI chỉ điền ô còn trống.
            servings: Number.isFinite(current.servings) ? current.servings : values.servings,
            prepTimeMinutes: Number.isFinite(current.prepTimeMinutes)
              ? current.prepTimeMinutes
              : values.prepTimeMinutes,
            cookTimeMinutes: Number.isFinite(current.cookTimeMinutes)
              ? current.cookTimeMinutes
              : values.cookTimeMinutes,
            categoryId: values.categoryId || current.categoryId,
            coverImageUrl: values.coverImageUrl || current.coverImageUrl,
            coverMedia: values.coverMedia ?? current.coverMedia,
          },
          { keepDefaultValues: true }
        );
        setSubmitError(null);
      },
      isDirty: () => form.formState.isDirty,
      hasUserContent: () => {
        const vals = form.getValues();
        const hasIngs = (vals.ingredients || []).some(
          (ing) => Boolean(ing.name?.trim()) || (typeof ing.amount === 'number' && ing.amount > 0)
        );
        const hasSteps = (vals.steps || []).some((st) => Boolean(st.instruction?.trim()));
        return hasIngs || hasSteps;
      },
    }));

    const values = form.watch();
    // Tính lại mỗi lần render: `watch()` có thể trả cùng tham chiếu nên không memo theo `values`.
    const liveIssues = issuesFromValues(values, { requireNutrition });
    const submittedIssues = collectFieldIssues(form.formState.errors);
    const categoryName = flatCategories.find((c) => c.id === values.categoryId)?.name;

    const stepIndex = RECIPE_EDITOR_STEPS.findIndex((s) => s.id === step);
    const current = RECIPE_EDITOR_STEPS[stepIndex]!;
    const next = RECIPE_EDITOR_STEPS[stepIndex + 1];
    const prev = RECIPE_EDITOR_STEPS[stepIndex - 1];

    const scrollToTop = () => {
      const top = topRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0) {
        topRef.current?.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    };

    const goTo = (target: RecipeEditorStep) => {
      setStep(target);
      requestAnimationFrame(scrollToTop);
    };

    /** Chờ bước mới render rồi cuộn + focus vào field lỗi. */
    const focusIssue = (issue: RecipeFieldIssue) => {
      setStep(issue.step);
      const tryFocus = (attempt: number) => {
        const target =
          document.getElementById(fieldDomId(issue.path)) ??
          document.getElementById(fieldDomId(issue.path.split('.')[0] ?? ''));
        if (!target) {
          if (attempt < 5) requestAnimationFrame(() => tryFocus(attempt + 1));
          return;
        }
        target.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'center',
        });
        target.focus({ preventScroll: true });
      };
      requestAnimationFrame(() => tryFocus(0));
    };

    const reportIssues = (issues: RecipeFieldIssue[], title: string) => {
      const first = issues[0];
      if (!first) return;
      const location = issueLocation(first.path);
      toast.error(title, {
        description:
          `${stepTitle(first.step)}${location ? ` · ${location}` : ''}: ${first.message}` +
          (issues.length > 1 ? ` (và ${issues.length - 1} mục khác)` : ''),
      });
      focusIssue(first);
    };

    const handleNext = async () => {
      if (step === 'review' || !next) return;
      const valid = await form.trigger(STEP_FIELDS[step]);
      if (!valid) {
        const issues = collectFieldIssues(form.formState.errors).filter((i) => i.step === step);
        reportIssues(issues, `Bước "${current.title}" còn thiếu thông tin`);
        return;
      }
      goTo(next.id);
    };

    const handleValid = async (submitted: RecipeFormValues) => {
      setSubmitError(null);
      try {
        await onSubmit(submitted);
      } catch (error) {
        // Mutation đã toast thông báo từ backend; ở đây chỉ đưa người dùng tới chỗ cần sửa.
        const code = getApiErrorCode(error);
        if (code && INGREDIENT_ERROR_CODES.has(code)) {
          setSubmitError(
            'Một số nguyên liệu không khớp danh mục chuẩn. Hãy gõ lại tên và chọn từ gợi ý.'
          );
          goTo('ingredients');
          return;
        }
        if (code === 'CONTENT_VERSION_CONFLICT') {
          setSubmitError(
            'Công thức vừa được cập nhật ở nơi khác. Đã tải phiên bản mới nhất, hãy kiểm tra rồi gửi lại.'
          );
          return;
        }
        setSubmitError(getApiErrorMessage(error, 'Không thể lưu công thức. Vui lòng thử lại.'));
      }
    };

    const handleInvalid = (errors: FieldErrors<RecipeFormValues>) => {
      reportIssues(collectFieldIssues(errors), 'Công thức còn thiếu thông tin bắt buộc');
    };

    const renumberSteps = () => {
      form.getValues('steps').forEach((_, idx) => {
        form.setValue(`steps.${idx}.stepNumber`, idx + 1);
      });
    };

    const errors = form.formState.errors;
    const seed: AiRecipeDraftSeed = {
      title: values.title ?? '',
      description: values.description ?? '',
      ingredientNames: (values.ingredients ?? [])
        .map((ing) => ing.name?.trim())
        .filter((name): name is string => Boolean(name)),
      ...(Number.isFinite(values.servings) ? { servings: values.servings } : {}),
      ...(Number.isFinite(values.prepTimeMinutes)
        ? { prepTimeMinutes: values.prepTimeMinutes }
        : {}),
      ...(Number.isFinite(values.cookTimeMinutes)
        ? { cookTimeMinutes: values.cookTimeMinutes }
        : {}),
    };

    return (
      <form
        aria-label={formTitle}
        noValidate
        onSubmit={form.handleSubmit(handleValid, handleInvalid)}
        onKeyDown={(e) => {
          // Enter trong ô nhập không được gửi form giữa chừng — chỉ nút "Gửi" ở bước cuối.
          if (e.key === 'Enter' && e.target instanceof HTMLInputElement) e.preventDefault();
        }}
        className="flex scroll-mt-24 flex-col gap-6"
      >
        <div ref={topRef} className="scroll-mt-24" />

        <nav aria-label="Các bước tạo công thức">
          <ol className="grid grid-cols-5 gap-2">
            {RECIPE_EDITOR_STEPS.map((s, index) => {
              const active = s.id === step;
              const complete = s.id !== 'review' && !liveIssues.some((i) => i.step === s.id);
              const hasError = submittedIssues.some((i) => i.step === s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    aria-current={active ? 'step' : undefined}
                    onClick={() => goTo(s.id)}
                    className="group flex w-full flex-col gap-2 text-left disabled:cursor-not-allowed"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'h-1 w-full rounded-full bg-muted transition-colors',
                        (active || complete) && 'bg-primary',
                        hasError && 'bg-destructive'
                      )}
                    />
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
                          active && 'border-primary bg-primary text-primary-foreground',
                          !active && complete && 'border-primary text-primary',
                          !active && !complete && 'text-muted-foreground',
                          hasError && !active && 'border-destructive text-destructive'
                        )}
                      >
                        {hasError && !active ? (
                          <AlertCircle aria-hidden className="size-3.5" />
                        ) : complete && !active ? (
                          <Check aria-hidden className="size-3.5" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span
                        className={cn(
                          'hidden truncate text-sm md:inline',
                          active
                            ? 'font-semibold'
                            : 'text-muted-foreground group-hover:text-foreground',
                          hasError && 'text-destructive'
                        )}
                      >
                        {s.title}
                      </span>
                      {hasError && <span className="sr-only">(có lỗi)</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-sm font-medium md:hidden">
            Bước {stepIndex + 1}/{RECIPE_EDITOR_STEPS.length}: {current.title}
          </p>
        </nav>

        <div
          className={cn(
            'grid items-start gap-6',
            step !== 'review' && 'lg:grid-cols-[minmax(0,1fr)_16rem]'
          )}
        >
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="text-balance">{current.title}</CardTitle>
              <CardDescription className="text-pretty">{current.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle aria-hidden />
                  <AlertTitle>Chưa lưu được công thức</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {step === 'basics' && (
                <FieldGroup>
                  <Field data-invalid={Boolean(errors.title) || undefined}>
                    <FieldLabel htmlFor={fieldDomId('title')}>
                      Tên món <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id={fieldDomId('title')}
                      placeholder="Ví dụ: Đậu hũ sốt nấm đông cô"
                      aria-invalid={Boolean(errors.title)}
                      aria-describedby={errors.title ? 'recipe-title-error' : undefined}
                      {...form.register('title')}
                    />
                    <FieldError id="recipe-title-error" errors={[errors.title]} />
                  </Field>

                  <Field data-invalid={Boolean(errors.description) || undefined}>
                    <div className="flex items-baseline justify-between gap-2">
                      <FieldLabel htmlFor={fieldDomId('description')}>Mô tả ngắn</FieldLabel>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {(values.description ?? '').length}/500
                      </span>
                    </div>
                    <Textarea
                      id={fieldDomId('description')}
                      rows={3}
                      placeholder="Hương vị, dịp phù hợp hoặc lý do bạn yêu món này"
                      aria-invalid={Boolean(errors.description)}
                      className="resize-none"
                      {...form.register('description')}
                    />
                    <FieldError errors={[errors.description]} />
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {(
                      [
                        ['servings', 'Khẩu phần (người)', 'Ví dụ: 4', 1],
                        ['prepTimeMinutes', 'Sơ chế (phút)', 'Ví dụ: 15', 0],
                        ['cookTimeMinutes', 'Nấu (phút)', 'Ví dụ: 25', 0],
                      ] as const
                    ).map(([name, label, placeholder, min]) => (
                      <Field key={name} data-invalid={Boolean(errors[name]) || undefined}>
                        <FieldLabel htmlFor={fieldDomId(name)}>
                          {label} <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id={fieldDomId(name)}
                          type="number"
                          inputMode="numeric"
                          min={min}
                          placeholder={placeholder}
                          aria-invalid={Boolean(errors[name])}
                          {...form.register(name, { valueAsNumber: true })}
                        />
                        <FieldError errors={[errors[name]]} />
                      </Field>
                    ))}
                  </div>

                  <Field>
                    <FieldLabel>Ảnh bìa món ăn</FieldLabel>
                    <FieldDescription>
                      Khuyến khích. Ảnh thành phẩm giúp công thức nổi bật trong kho.
                    </FieldDescription>
                    <ImageUploader
                      value={values.coverImageUrl}
                      onChange={(url, meta) => {
                        form.setValue('coverImageUrl', url, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        form.setValue(
                          'coverMedia',
                          meta?.assetId || (meta?.publicId && meta?.mimeType && meta?.bytes)
                            ? {
                                assetId: meta?.assetId,
                                publicId: meta?.publicId,
                                mimeType: meta?.mimeType,
                                bytes: meta?.bytes,
                              }
                            : null,
                          { shouldDirty: true }
                        );
                      }}
                    />
                    <FieldError errors={[errors.coverImageUrl]} />
                  </Field>
                </FieldGroup>
              )}

              {step === 'ingredients' && (
                <div className="flex flex-col gap-4">
                  {renderAssistant?.(seed, { editBasics: () => goTo('basics') })}

                  <div
                    id={fieldDomId('ingredients')}
                    tabIndex={-1}
                    className="flex flex-col gap-3 outline-none"
                  >
                    {ingredientFields.map((field, idx) => (
                      <RecipeIngredientRow
                        key={field.id}
                        index={idx}
                        form={form}
                        onRemove={() => removeIngredient(idx)}
                        canRemove={ingredientFields.length > 1}
                      />
                    ))}
                  </div>
                  <FieldError errors={[errors.ingredients?.root, errors.ingredients]} />

                  <Button
                    type="button"
                    variant="outline"
                    className="self-start"
                    onClick={() => appendIngredient(EMPTY_INGREDIENT)}
                  >
                    <Plus data-icon="inline-start" />
                    Thêm nguyên liệu
                  </Button>
                </div>
              )}

              {step === 'steps' && (
                <div className="flex flex-col gap-4">
                  <ol
                    id={fieldDomId('steps')}
                    tabIndex={-1}
                    className="flex flex-col gap-3 outline-none"
                  >
                    {stepFields.map((field, idx) => {
                      const stepError = errors.steps?.[idx]?.instruction;
                      const inputId = fieldDomId(`steps.${idx}.instruction`);
                      return (
                        <li
                          key={field.id}
                          data-invalid={Boolean(stepError) || undefined}
                          className="flex gap-3 rounded-xl border bg-card p-3 data-[invalid]:border-destructive/60"
                        >
                          <span
                            aria-hidden
                            className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums"
                          >
                            {idx + 1}
                          </span>
                          <Field className="min-w-0 flex-1 gap-1.5">
                            <FieldLabel htmlFor={inputId} className="sr-only">
                              Bước {idx + 1}
                            </FieldLabel>
                            <Textarea
                              id={inputId}
                              rows={3}
                              placeholder={
                                idx === 0
                                  ? 'Ví dụ: Rửa sạch nấm, cắt miếng vừa ăn rồi để ráo.'
                                  : `Mô tả bước ${idx + 1}`
                              }
                              aria-invalid={Boolean(stepError)}
                              className="resize-none"
                              {...form.register(`steps.${idx}.instruction`)}
                            />
                            <FieldError className="text-xs" errors={[stepError]} />
                          </Field>
                          <div className="flex shrink-0 flex-col gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={idx === 0}
                              aria-label={`Đưa bước ${idx + 1} lên trên`}
                              onClick={() => {
                                moveStep(idx, idx - 1);
                                renumberSteps();
                              }}
                            >
                              <ArrowUp aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={idx === stepFields.length - 1}
                              aria-label={`Đưa bước ${idx + 1} xuống dưới`}
                              onClick={() => {
                                moveStep(idx, idx + 1);
                                renumberSteps();
                              }}
                            >
                              <ArrowDown aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              disabled={stepFields.length <= 1}
                              aria-label={`Xóa bước ${idx + 1}`}
                              onClick={() => {
                                removeStep(idx);
                                renumberSteps();
                              }}
                            >
                              <Trash2 aria-hidden />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  <FieldError errors={[errors.steps?.root, errors.steps]} />

                  <Button
                    type="button"
                    variant="outline"
                    className="self-start"
                    onClick={() =>
                      appendStep({ stepNumber: stepFields.length + 1, instruction: '' })
                    }
                  >
                    <Plus data-icon="inline-start" />
                    Thêm bước
                  </Button>
                </div>
              )}

              {step === 'classify' && (
                <FieldGroup>
                  <Field data-invalid={Boolean(errors.categoryId) || undefined}>
                    <FieldLabel htmlFor={fieldDomId('categoryId')}>
                      Danh mục món <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={values.categoryId}
                      onValueChange={(val) =>
                        form.setValue('categoryId', val, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      disabled={categoryQuery.isLoading || categoryQuery.isError}
                    >
                      <SelectTrigger
                        id={fieldDomId('categoryId')}
                        aria-invalid={Boolean(errors.categoryId)}
                        className="w-full sm:max-w-sm"
                      >
                        <SelectValue
                          placeholder={
                            categoryQuery.isLoading ? 'Đang tải danh mục…' : 'Chọn danh mục'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {flatCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {categoryQuery.isError && (
                      <FieldDescription className="text-destructive">
                        Không tải được danh mục.{' '}
                        <button
                          type="button"
                          className="underline underline-offset-2"
                          onClick={() => void categoryQuery.refetch()}
                        >
                          Thử lại
                        </button>
                      </FieldDescription>
                    )}
                    {categoryQuery.isSuccess && flatCategories.length === 0 && (
                      <FieldDescription>Chưa có danh mục công thức nào.</FieldDescription>
                    )}
                    <FieldError errors={[errors.categoryId]} />
                  </Field>

                  <Field>
                    <FieldLabel>Độ khó</FieldLabel>
                    <RadioGroup
                      value={values.difficulty}
                      onValueChange={(val) =>
                        form.setValue('difficulty', val as RecipeDifficulty, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      className="grid gap-3 sm:grid-cols-3"
                    >
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <FieldLabel
                          key={option.value}
                          htmlFor={`recipe-difficulty-${option.value}`}
                          className="has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                        >
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              id={`recipe-difficulty-${option.value}`}
                              value={option.value}
                            />
                            <FieldContent>
                              <FieldTitle>{option.label}</FieldTitle>
                              <FieldDescription className="text-xs">
                                {option.description}
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                        </FieldLabel>
                      ))}
                    </RadioGroup>
                  </Field>

                  <FieldSet id={fieldDomId('nutrition')} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-col gap-1">
                        <FieldLegend variant="label">
                          Dinh dưỡng mỗi khẩu phần
                          {requireNutrition ? ' *' : ' (không bắt buộc)'}
                        </FieldLegend>
                        <FieldDescription className="text-xs text-pretty">
                          {requireNutrition
                            ? 'Bắt buộc nhập đủ 6 chỉ số. Với tài khoản Contributor/Admin, công thức được xuất bản ngay sau khi đăng.'
                            : 'Để trống ô nào thì hệ thống tự tính ô đó từ nguyên liệu khi gửi duyệt. Ban biên tập kiểm tra lại trước khi xuất bản.'}
                        </FieldDescription>
                      </div>
                      {postId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => setPreviewDrawerOpen(true)}
                        >
                          <Eye data-icon="inline-start" />
                          Xem ước tính
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {RECIPE_NUTRITION_FIELDS.map((field) => {
                        const error = errors.nutrition?.[field.key];
                        const path = `nutrition.${field.key}` as const;
                        return (
                          <Field key={field.key} data-invalid={Boolean(error)}>
                            <FieldLabel htmlFor={fieldDomId(path)}>
                              {field.label} ({field.unit})
                            </FieldLabel>
                            <Input
                              id={fieldDomId(path)}
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step={field.integer ? 1 : 0.1}
                              placeholder={requireNutrition ? 'Bắt buộc' : 'Tự tính'}
                              aria-invalid={Boolean(error)}
                              className="tabular-nums"
                              {...form.register(path, {
                                setValueAs: (raw: unknown) =>
                                  raw === '' || raw === null || raw === undefined
                                    ? undefined
                                    : Number(raw),
                              })}
                            />
                            <FieldError errors={[error]} />
                          </Field>
                        );
                      })}
                    </div>
                  </FieldSet>
                </FieldGroup>
              )}

              {step === 'review' && (
                <RecipeEditorReview
                  values={values}
                  issues={liveIssues}
                  categoryName={categoryName}
                  onEdit={(target) => goTo(target)}
                  onFixIssue={focusIssue}
                />
              )}
            </CardContent>

            <CardFooter className="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-between">
              {prev ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                  onClick={() => goTo(prev.id)}
                >
                  <ArrowLeft data-icon="inline-start" />
                  {prev.title}
                </Button>
              ) : (
                <span aria-hidden className="hidden sm:block" />
              )}
              {/* key khác nhau: nếu React tái dùng cùng nút DOM, cú click "Tiếp" ở bước 4 đổi
                  type thành submit trước khi trình duyệt chạy hành động mặc định → tự gửi form. */}
              {step === 'review' ? (
                <Button
                  key="submit-recipe"
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Send data-icon="inline-start" />
                  )}
                  {isSubmitting ? 'Đang gửi…' : submitLabel}
                </Button>
              ) : (
                <Button
                  key="next-step"
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => void handleNext()}
                >
                  Tiếp: {next?.title}
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
            </CardFooter>
          </Card>

          {step !== 'review' && (
            <div className="hidden lg:block">
              <RecipeEditorProgress
                values={values}
                issues={liveIssues}
                categoryName={categoryName}
                currentStep={step as RecipeContentStep}
                onSelect={(target) => goTo(target)}
              />
            </div>
          )}
        </div>

        {postId && (
          <RecipeNutritionPreviewDrawer
            postId={postId}
            isOpen={previewDrawerOpen}
            onClose={() => setPreviewDrawerOpen(false)}
          />
        )}
      </form>
    );
  }
);
