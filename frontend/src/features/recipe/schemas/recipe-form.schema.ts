import { z } from 'zod';
import { RecipeDifficulty } from '@/common/enums';

// Chỉ giữ field thật sự được gửi lên `POST/PATCH /posts`. Ghi chú nguyên liệu,
// mẹo từng bước và nhãn chế độ ăn không có chỗ trong contract nên đã bỏ khỏi form.
export const recipeIngredientSchema = z.object({
  ingredientId: z.string().nullable().optional(),
  name: z.string().trim().min(1, 'Nhập tên nguyên liệu'),
  amount: z.number({ message: 'Nhập định lượng' }).positive('Định lượng phải lớn hơn 0'),
  unit: z.string().trim().min(1, 'Chọn đơn vị'),
});

export const recipeStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  instruction: z.string().trim().min(5, 'Mô tả bước nấu cần ít nhất 5 ký tự'),
  imageUrl: z.string().nullable().optional(),
});

/** 6 chỉ số dinh dưỡng mỗi khẩu phần do tác giả nhập (khoá trùng contract backend). */
export const RECIPE_NUTRITION_FIELDS = [
  { key: 'calories', label: 'Năng lượng', unit: 'kcal', integer: true },
  { key: 'proteinGrams', label: 'Protein', unit: 'g', integer: false },
  { key: 'carbsGrams', label: 'Carbohydrate', unit: 'g', integer: false },
  { key: 'fatGrams', label: 'Chất béo', unit: 'g', integer: false },
  { key: 'fiberGrams', label: 'Chất xơ', unit: 'g', integer: false },
  { key: 'vitaminB12Mcg', label: 'Vitamin B12', unit: 'mcg', integer: false },
] as const;

export type RecipeNutritionKey = (typeof RECIPE_NUTRITION_FIELDS)[number]['key'];

// Input dùng `setValueAs` để ô trống thành `undefined` (chưa nhập), không phải NaN hay 0.
const optionalNutritionValue = z
  .number({ message: 'Nhập số hợp lệ' })
  .min(0, 'Không được âm')
  .max(99_999, 'Giá trị quá lớn')
  .optional();

export const recipeNutritionFormSchema = z.object({
  calories: optionalNutritionValue,
  proteinGrams: optionalNutritionValue,
  carbsGrams: optionalNutritionValue,
  fatGrams: optionalNutritionValue,
  fiberGrams: optionalNutritionValue,
  vitaminB12Mcg: optionalNutritionValue,
});

export const recipeFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Tên món cần ít nhất 5 ký tự')
    .max(200, 'Tên món không được vượt quá 200 ký tự'),
  categoryId: z.string().min(1, 'Chọn danh mục món ăn'),
  coverImageUrl: z.string().url('Đường dẫn ảnh bìa không hợp lệ').or(z.literal('')).optional(),
  coverMedia: z
    .object({
      assetId: z.string().optional(),
      publicId: z.string().optional(),
      mimeType: z.string().optional(),
      bytes: z.number().optional(),
    })
    .nullable()
    .optional(),
  difficulty: z.nativeEnum(RecipeDifficulty),
  servings: z
    .number({ message: 'Nhập số người ăn' })
    .int('Khẩu phần phải là số nguyên')
    .min(1, 'Khẩu phần tối thiểu là 1 người'),
  prepTimeMinutes: z
    .number({ message: 'Nhập thời gian sơ chế' })
    .int('Thời gian phải là số phút nguyên')
    .min(0, 'Thời gian sơ chế không được âm'),
  cookTimeMinutes: z
    .number({ message: 'Nhập thời gian nấu' })
    .int('Thời gian phải là số phút nguyên')
    .min(0, 'Thời gian nấu không được âm'),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
  ingredients: z.array(recipeIngredientSchema).min(1, 'Cần ít nhất 1 nguyên liệu'),
  steps: z.array(recipeStepSchema).min(1, 'Cần ít nhất 1 bước nấu'),
  nutrition: recipeNutritionFormSchema.optional(),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

/**
 * Contributor/Admin phải nhập đủ 6 chỉ số (backend vẫn kiểm tra lại theo role thật).
 * User thường để trống được: hệ thống tự tính khi gửi duyệt.
 */
export function buildRecipeFormSchema(options: { requireNutrition: boolean }) {
  if (!options.requireNutrition) return recipeFormSchema;
  return recipeFormSchema.superRefine((values, context) => {
    for (const field of RECIPE_NUTRITION_FIELDS) {
      if (values.nutrition?.[field.key] === undefined) {
        context.addIssue({
          code: 'custom',
          path: ['nutrition', field.key],
          message: `Nhập ${field.label.toLowerCase()} mỗi khẩu phần`,
        });
      }
    }
  });
}
