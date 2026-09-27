import { z } from 'zod';

export const selectedMealSchema = z.discriminatedUnion('sourceType', [
  z.object({
    sourceType: z.literal('RECIPE'),
    recipeId: z.string().uuid('ID công thức không hợp lệ'),
    servings: z.number().positive('Số khẩu phần phải lớn hơn 0').max(100, 'Tối đa 100 khẩu phần'),
  }),
  z.object({
    sourceType: z.literal('CUSTOM_MEAL'),
    customMealId: z.string().uuid('ID món ăn không hợp lệ'),
    servings: z.number().positive('Số khẩu phần phải lớn hơn 0').max(100, 'Tối đa 100 khẩu phần'),
  }),
]);

export const shoppingGapPreviewSchema = z.object({
  meals: z
    .array(selectedMealSchema)
    .min(1, 'Cần chọn ít nhất một món ăn')
    .max(50, 'Tối đa 50 món ăn'),
});

export type SelectedMealFormValues = z.infer<typeof selectedMealSchema>;
export type ShoppingGapPreviewFormValues = z.infer<typeof shoppingGapPreviewSchema>;
