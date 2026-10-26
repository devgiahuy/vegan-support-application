import type { FieldErrors, FieldPath } from 'react-hook-form';
import { recipeFormSchema, type RecipeFormValues } from '../schemas/recipe-form.schema';

export type RecipeEditorStep = 'basics' | 'ingredients' | 'steps' | 'classify' | 'review';
export type RecipeContentStep = Exclude<RecipeEditorStep, 'review'>;

export const RECIPE_EDITOR_STEPS: Array<{
  id: RecipeEditorStep;
  title: string;
  description: string;
}> = [
  {
    id: 'basics',
    title: 'Thông tin cơ bản',
    description: 'Tên món, mô tả ngắn, khẩu phần, thời gian và ảnh bìa.',
  },
  {
    id: 'ingredients',
    title: 'Nguyên liệu',
    description: 'Gõ tên rồi chọn từ gợi ý để liên kết danh mục chuẩn, kèm định lượng.',
  },
  {
    id: 'steps',
    title: 'Các bước nấu',
    description: 'Viết lần lượt từng bước, mỗi bước một thao tác. Có thể đổi thứ tự.',
  },
  {
    id: 'classify',
    title: 'Phân loại',
    description: 'Danh mục, độ khó và cách hệ thống tính dinh dưỡng.',
  },
  {
    id: 'review',
    title: 'Xem lại & gửi',
    description: 'Kiểm tra toàn bộ công thức trước khi gửi.',
  },
];

/** Field gốc thuộc từng bước — dùng để `trigger()` khi bấm "Tiếp tục". */
export const STEP_FIELDS: Record<RecipeContentStep, FieldPath<RecipeFormValues>[]> = {
  basics: [
    'title',
    'description',
    'servings',
    'prepTimeMinutes',
    'cookTimeMinutes',
    'coverImageUrl',
  ],
  ingredients: ['ingredients'],
  steps: ['steps'],
  classify: ['categoryId', 'difficulty'],
};

const FIELD_ORDER: string[] = Object.values(STEP_FIELDS).flat();
const ROW_KEY_ORDER = ['name', 'amount', 'unit', 'instruction'];

/** `id` DOM của input ứng với một đường dẫn field (dùng để focus/scroll tới lỗi). */
export function fieldDomId(path: string): string {
  return `recipe-${path.replace(/\./g, '-')}`;
}

export interface RecipeFieldIssue {
  path: string;
  step: RecipeContentStep;
  message: string;
}

function stepOfPath(path: string): RecipeContentStep {
  const root = path.split('.')[0] ?? '';
  const entry = (Object.entries(STEP_FIELDS) as [RecipeContentStep, string[]][]).find(
    ([, fields]) => fields.includes(root)
  );
  return entry?.[0] ?? 'basics';
}

/** Thứ tự hiển thị: bước → field → dòng → cột trong dòng. */
function rankOfPath(path: string): number {
  const [root = '', index, key] = path.split('.');
  const rowIndex = index !== undefined && /^\d+$/.test(index) ? Number(index) + 1 : 0;
  return (
    FIELD_ORDER.indexOf(root) * 100000 + rowIndex * 10 + (key ? ROW_KEY_ORDER.indexOf(key) + 1 : 0)
  );
}

function sortIssues(issues: Array<{ path: string; message: string }>): RecipeFieldIssue[] {
  const unique = new Map<string, string>();
  for (const issue of issues) if (!unique.has(issue.path)) unique.set(issue.path, issue.message);
  return [...unique.entries()]
    .map(([path, message]) => ({ path, message, step: stepOfPath(path) }))
    .sort((a, b) => rankOfPath(a.path) - rankOfPath(b.path));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Duyệt cây lỗi của react-hook-form và trả về danh sách lỗi theo thứ tự form. */
export function collectFieldIssues(errors: FieldErrors<RecipeFormValues>): RecipeFieldIssue[] {
  const found: Array<{ path: string; message: string }> = [];
  const walk = (node: unknown, prefix: string) => {
    if (!isRecord(node)) return;
    if (typeof node.message === 'string' && node.message && prefix) {
      found.push({ path: prefix, message: node.message });
    }
    for (const [key, child] of Object.entries(node)) {
      if (key === 'ref' || key === 'message' || key === 'type' || key === 'types') continue;
      // Lỗi cấp mảng (vd thiếu nguyên liệu) nằm ở `root` — gắn vào chính field mảng.
      walk(child, key === 'root' ? prefix : prefix ? `${prefix}.${key}` : key);
    }
  };
  walk(errors, '');
  return sortIssues(found);
}

/** Lỗi tính trực tiếp từ giá trị hiện tại — để bước xem lại báo thiếu trước khi gửi. */
export function issuesFromValues(values: RecipeFormValues): RecipeFieldIssue[] {
  const result = recipeFormSchema.safeParse(values);
  if (result.success) return [];
  return sortIssues(
    result.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    }))
  );
}

export function stepTitle(step: RecipeEditorStep): string {
  return RECIPE_EDITOR_STEPS.find((s) => s.id === step)?.title ?? '';
}

/** Mô tả vị trí lỗi cho người dùng, ví dụ "Nguyên liệu 2" hoặc "Bước nấu 1". */
export function issueLocation(path: string): string | null {
  const ingredient = /^ingredients\.(\d+)\./.exec(path);
  if (ingredient) return `Nguyên liệu ${Number(ingredient[1]) + 1}`;
  const step = /^steps\.(\d+)\./.exec(path);
  if (step) return `Bước nấu ${Number(step[1]) + 1}`;
  return null;
}
