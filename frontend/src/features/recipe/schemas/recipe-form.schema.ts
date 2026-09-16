import { z } from 'zod';
import { RecipeDifficulty } from '@/common/enums';

export const recipeIngredientSchema = z.object({
  ingredientId: z.string().nullable().optional(),
  name: z.string().min(1, 'Tên nguyên liệu không được để trống'),
  amount: z.number().positive('Định lượng phải lớn hơn 0'),
  unit: z.string().min(1, 'Đơn vị tính không được để trống'),
  notes: z.string().optional(),
});

export const recipeStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  instruction: z.string().min(5, 'Hướng dẫn bước nấu phải có ít nhất 5 ký tự'),
  imageUrl: z.string().nullable().optional(),
  tip: z.string().optional(),
});

export const recipeNutritionSchema = z.object({
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0),
  vitaminB12: z.number().min(0),
});

export const recipeFormSchema = z.object({
  title: z
    .string()
    .min(5, 'Tiêu đề công thức phải có ít nhất 5 ký tự')
    .max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục món ăn'),
  coverImageUrl: z.string().url('Đường dẫn ảnh bìa không hợp lệ').or(z.literal('')).optional(),
  coverMedia: z
    .object({
      publicId: z.string(),
      mimeType: z.string(),
      bytes: z.number(),
    })
    .nullable()
    .optional(),
  difficulty: z.nativeEnum(RecipeDifficulty),
  servings: z.number().int().min(1, 'Khẩu phần ăn tối thiểu là 1 người'),
  prepTimeMinutes: z.number().int().min(0, 'Thời gian sơ chế không được âm'),
  cookTimeMinutes: z.number().int().min(0, 'Thời gian nấu không được âm'),
  dietTag: z.string().optional(),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
  ingredients: z
    .array(recipeIngredientSchema)
    .min(1, 'Công thức cần có ít nhất 1 nguyên liệu có định lượng'),
  steps: z.array(recipeStepSchema).min(1, 'Công thức cần có ít nhất 1 bước thực hiện'),
  nutrition: recipeNutritionSchema.optional(),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
