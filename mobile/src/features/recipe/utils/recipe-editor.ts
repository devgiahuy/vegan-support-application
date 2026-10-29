import { RecipeDifficulty } from '@/common/enums';
import type { CreateRecipeInput, CreateRecipeStepInput } from '../api/recipe.api';
import { MIN_RECIPE_BODY_LENGTH, stepsToBody } from './recipe-body';

/** 5 bước của form công thức — đồng bộ `frontend/.../recipe-editor-steps.ts`. */
export type RecipeEditorStep = 'basics' | 'ingredients' | 'steps' | 'classify' | 'review';
export type RecipeContentStep = Exclude<RecipeEditorStep, 'review'>;

export const RECIPE_EDITOR_STEPS: { id: RecipeEditorStep; title: string; description: string }[] = [
  { id: 'basics', title: 'Thông tin cơ bản', description: 'Tên món, mô tả ngắn, khẩu phần, thời gian và ảnh bìa.' },
  { id: 'ingredients', title: 'Nguyên liệu', description: 'Gõ tên rồi chọn từ gợi ý để liên kết danh mục chuẩn, kèm định lượng.' },
  { id: 'steps', title: 'Các bước nấu', description: 'Viết lần lượt từng bước, mỗi bước một thao tác. Có thể đổi thứ tự.' },
  { id: 'classify', title: 'Phân loại', description: 'Danh mục, độ khó và cách hệ thống tính dinh dưỡng.' },
  { id: 'review', title: 'Xem lại & gửi', description: 'Kiểm tra toàn bộ công thức trước khi gửi.' },
];

export const CONTENT_STEPS = RECIPE_EDITOR_STEPS.filter((step) => step.id !== 'review') as {
  id: RecipeContentStep;
  title: string;
  description: string;
}[];

export function stepTitle(step: RecipeEditorStep): string {
  return RECIPE_EDITOR_STEPS.find((item) => item.id === step)?.title ?? '';
}

export const DIFFICULTY_OPTIONS: { value: RecipeDifficulty; label: string; description: string }[] = [
  { value: RecipeDifficulty.EASY, label: 'Dễ', description: 'Người mới vào bếp làm được.' },
  { value: RecipeDifficulty.MEDIUM, label: 'Trung bình', description: 'Cần chút kinh nghiệm.' },
  { value: RecipeDifficulty.HARD, label: 'Nâng cao', description: 'Nhiều công đoạn, kỹ thuật.' },
];

export function difficultyLabel(value: RecipeDifficulty): string {
  return DIFFICULTY_OPTIONS.find((option) => option.value === value)?.label ?? 'Chưa chọn';
}

/** Dòng nguyên liệu trong form; số lượng giữ dạng chuỗi để người dùng gõ tự do. */
export interface EditorIngredient {
  key: string;
  ingredientId: string | null;
  name: string;
  amount: string;
  unit: string;
  optional?: boolean;
  /** Vị trí ban đầu (sửa công thức / bản nháp AI) để dịch lại tham chiếu của bước nấu khi thêm/xóa/đổi chỗ. */
  originalPosition?: number;
}

/** Bước nấu; các trường phụ không có ô nhập vẫn được giữ nguyên để bản sửa không làm mất dữ liệu. */
export interface EditorStep {
  key: string;
  instruction: string;
  durationMinutes?: number | null;
  cookingMethodId?: string | null;
  temperatureCelsius?: number | null;
  affectedIngredientPositions?: number[];
}

export interface RecipeEditorValues {
  title: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  categoryId: string | null;
  difficulty: RecipeDifficulty;
  ingredients: EditorIngredient[];
  steps: EditorStep[];
}

/** Dữ liệu ban đầu khi sửa công thức đã có. */
export interface RecipeFormInitial {
  title?: string;
  excerpt?: string;
  /** Ảnh bìa hiện có (chỉ để xem trước khi sửa). */
  coverImageUrl?: string | null;
  categoryId?: string | null;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: RecipeDifficulty;
  /** Form không có ô tag; giữ nguyên tag đã có khi sửa. */
  tags?: string[];
  ingredients?: {
    displayName: string;
    amount: number;
    unit: string;
    ingredientId?: string | null;
    optional?: boolean;
    position?: number;
  }[];
  steps?: Omit<EditorStep, 'key'>[];
}

export function emptyIngredient(key: string): EditorIngredient {
  return { key, ingredientId: null, name: '', amount: '', unit: '' };
}

export function emptyStep(key: string): EditorStep {
  return { key, instruction: '' };
}

export function toEditorValues(initial: RecipeFormInitial | undefined): RecipeEditorValues {
  const ingredients = (initial?.ingredients ?? []).map((item, index) => ({
    key: `init-ing-${index}`,
    ingredientId: item.ingredientId ?? null,
    name: item.displayName,
    amount: String(item.amount),
    unit: item.unit,
    ...(item.optional ? { optional: true } : {}),
    originalPosition: item.position ?? index,
  }));
  const steps = (initial?.steps ?? []).map((step, index) => ({ ...step, key: `init-step-${index}` }));
  const number = (value: number | undefined) => (value === undefined ? '' : String(value));
  return {
    title: initial?.title ?? '',
    description: initial?.excerpt ?? '',
    servings: number(initial?.servings),
    prepTime: number(initial?.prepTimeMinutes),
    cookTime: number(initial?.cookTimeMinutes),
    categoryId: initial?.categoryId ?? null,
    difficulty: initial?.difficulty ?? RecipeDifficulty.MEDIUM,
    ingredients: ingredients.length > 0 ? ingredients : [emptyIngredient('new-ing-0')],
    steps: steps.length > 0 ? steps : [emptyStep('new-step-0')],
  };
}

export interface RecipeFieldIssue {
  path: string;
  step: RecipeContentStep;
  message: string;
}

/** Chuỗi số người dùng gõ (chấp nhận dấu phẩy) → số; rỗng/không hợp lệ → NaN. */
export function parseAmount(text: string): number {
  const normalized = text.trim().replace(',', '.');
  return normalized === '' ? Number.NaN : Number(normalized);
}

function integerIssue(text: string, min: number, empty: string, notInteger: string, tooSmall: string): string | null {
  const value = parseAmount(text);
  if (Number.isNaN(value)) return empty;
  if (!Number.isInteger(value)) return notInteger;
  if (value < min) return tooSmall;
  return null;
}

/**
 * Kiểm tra giá trị form theo đúng luật của web (`recipe-form.schema.ts`) và thứ tự bước → field → dòng.
 * Thêm một luật mobile cần cho backend: `body` dựng từ các bước phải đủ 20 ký tự.
 */
export function validateRecipeEditor(values: RecipeEditorValues): RecipeFieldIssue[] {
  const issues: RecipeFieldIssue[] = [];
  const add = (step: RecipeContentStep, path: string, message: string | null) => {
    if (message) issues.push({ path, step, message });
  };

  const title = values.title.trim();
  add('basics', 'title', title.length < 5 ? 'Tên món cần ít nhất 5 ký tự' : title.length > 200 ? 'Tên món không được vượt quá 200 ký tự' : null);
  add('basics', 'description', values.description.length > 500 ? 'Mô tả tối đa 500 ký tự' : null);
  add('basics', 'servings', integerIssue(values.servings, 1, 'Nhập số người ăn', 'Khẩu phần phải là số nguyên', 'Khẩu phần tối thiểu là 1 người'));
  add('basics', 'prepTimeMinutes', integerIssue(values.prepTime, 0, 'Nhập thời gian sơ chế', 'Thời gian phải là số phút nguyên', 'Thời gian sơ chế không được âm'));
  add('basics', 'cookTimeMinutes', integerIssue(values.cookTime, 0, 'Nhập thời gian nấu', 'Thời gian phải là số phút nguyên', 'Thời gian nấu không được âm'));

  if (values.ingredients.length === 0) add('ingredients', 'ingredients', 'Cần ít nhất 1 nguyên liệu');
  values.ingredients.forEach((ingredient, index) => {
    add('ingredients', `ingredients.${index}.name`, ingredient.name.trim() ? null : 'Nhập tên nguyên liệu');
    const amount = parseAmount(ingredient.amount);
    add('ingredients', `ingredients.${index}.amount`, Number.isNaN(amount) ? 'Nhập định lượng' : amount <= 0 ? 'Định lượng phải lớn hơn 0' : null);
    add('ingredients', `ingredients.${index}.unit`, ingredient.unit.trim() ? null : 'Chọn đơn vị');
  });

  if (values.steps.length === 0) add('steps', 'steps', 'Cần ít nhất 1 bước nấu');
  let stepsOk = values.steps.length > 0;
  values.steps.forEach((step, index) => {
    const message = step.instruction.trim().length >= 5 ? null : 'Mô tả bước nấu cần ít nhất 5 ký tự';
    if (message) stepsOk = false;
    add('steps', `steps.${index}.instruction`, message);
  });
  if (stepsOk && stepsToBody(values.steps).length < MIN_RECIPE_BODY_LENGTH) {
    add('steps', 'steps', `Các bước nấu cần mô tả tổng cộng ít nhất ${MIN_RECIPE_BODY_LENGTH} ký tự`);
  }

  add('classify', 'categoryId', values.categoryId ? null : 'Chọn danh mục món ăn');
  return issues;
}

/** Mô tả vị trí lỗi cho người dùng, ví dụ "Nguyên liệu 2" hoặc "Bước nấu 1". */
export function issueLocation(path: string): string | null {
  const ingredient = /^ingredients\.(\d+)\./.exec(path);
  if (ingredient) return `Nguyên liệu ${Number(ingredient[1]) + 1}`;
  const step = /^steps\.(\d+)\./.exec(path);
  if (step) return `Bước nấu ${Number(step[1]) + 1}`;
  return null;
}

/** Một dòng trạng thái ngắn cho từng phần ở thanh tiến độ/bước xem lại. */
export function sectionStatus(step: RecipeContentStep, values: RecipeEditorValues, categoryName?: string): string {
  switch (step) {
    case 'basics':
      return values.title.trim() || 'Chưa có tên món';
    case 'ingredients': {
      const filled = values.ingredients.filter((item) => item.name.trim());
      const linked = filled.filter((item) => item.ingredientId).length;
      return filled.length ? `${filled.length} nguyên liệu · ${linked} đã liên kết` : 'Chưa có';
    }
    case 'steps': {
      const filled = values.steps.filter((item) => item.instruction.trim()).length;
      return filled ? `${filled} bước` : 'Chưa có';
    }
    case 'classify':
      return categoryName ?? 'Chưa chọn danh mục';
  }
}

/** Đã có nguyên liệu hoặc bước nấu do người dùng nhập (bản nháp AI sẽ ghi đè các phần này). */
export function hasUserContent(values: RecipeEditorValues): boolean {
  const hasIngredients = values.ingredients.some((item) => item.name.trim() || parseAmount(item.amount) > 0);
  const hasSteps = values.steps.some((item) => item.instruction.trim());
  return hasIngredients || hasSteps;
}

/**
 * Giá trị form → payload `CreateRecipeInput`. Vị trí nguyên liệu bị đổi/xóa được dịch lại cho
 * `affectedIngredientPositions` của từng bước; tham chiếu tới nguyên liệu đã xóa bị bỏ.
 */
export function buildRecipeInput(
  values: RecipeEditorValues,
  extras: { coverAssetId?: string; tags?: string[] }
): CreateRecipeInput {
  const positionMap = new Map<number, number>();
  values.ingredients.forEach((ingredient, index) => {
    if (ingredient.originalPosition !== undefined) positionMap.set(ingredient.originalPosition, index);
  });
  const steps: CreateRecipeStepInput[] = values.steps.map((step) => {
    const affected = (step.affectedIngredientPositions ?? [])
      .map((position) => positionMap.get(position))
      .filter((position): position is number => position !== undefined);
    return {
      instruction: step.instruction.trim(),
      ...(step.durationMinutes && step.durationMinutes > 0 ? { durationMinutes: Math.trunc(step.durationMinutes) } : {}),
      ...(step.cookingMethodId ? { cookingMethodId: step.cookingMethodId } : {}),
      ...(typeof step.temperatureCelsius === 'number' ? { temperatureCelsius: step.temperatureCelsius } : {}),
      ...(affected.length > 0 ? { affectedIngredientPositions: affected } : {}),
    };
  });
  return {
    title: values.title.trim(),
    excerpt: values.description.trim() || undefined,
    ...(extras.coverAssetId ? { coverAssetId: extras.coverAssetId } : {}),
    categoryIds: values.categoryId ? [values.categoryId] : undefined,
    ...(extras.tags?.length ? { tags: extras.tags } : {}),
    servings: Math.trunc(parseAmount(values.servings)),
    prepTimeMinutes: Math.trunc(parseAmount(values.prepTime)),
    cookTimeMinutes: Math.trunc(parseAmount(values.cookTime)),
    difficulty: values.difficulty,
    ingredients: values.ingredients.map((ingredient) => ({
      displayName: ingredient.name.trim(),
      amount: parseAmount(ingredient.amount),
      unit: ingredient.unit.trim(),
      ...(ingredient.ingredientId ? { ingredientId: ingredient.ingredientId } : {}),
      ...(ingredient.optional ? { optional: true } : {}),
    })),
    steps,
  };
}
