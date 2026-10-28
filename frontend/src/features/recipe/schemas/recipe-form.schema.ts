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
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
