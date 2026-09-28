import { z } from 'zod';

export const pantryItemFormSchema = z
  .object({
    isCanonical: z.boolean().default(true),
    ingredientId: z.string().uuid().optional().or(z.literal('')),
    unmatchedText: z.string().trim().max(160).optional(),
    quantity: z.number().positive('Số lượng phải lớn hơn 0'),
    unit: z.string().trim().min(1, 'Đơn vị không được để trống').max(40),
    confidence: z.number().min(0).max(1).default(1),
    purchasedAt: z.string().optional(),
    openedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    freshnessNote: z.string().trim().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isCanonical) {
      if (!data.ingredientId || !z.string().uuid().safeParse(data.ingredientId).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng chọn nguyên liệu chuẩn từ từ điển',
          path: ['ingredientId'],
        });
      }
    } else {
      if (!data.unmatchedText || data.unmatchedText.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng nhập tên nguyên liệu tự do',
          path: ['unmatchedText'],
        });
      }
    }
  });

export type PantryItemFormData = z.infer<typeof pantryItemFormSchema>;

export const pantryUpdateFormSchema = z.object({
  expectedVersion: z.number().int().positive(),
  confidence: z.number().min(0).max(1).optional(),
  purchasedAt: z.string().optional(),
  openedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  freshnessNote: z.string().trim().max(1000).optional(),
});

export type PantryUpdateFormData = z.infer<typeof pantryUpdateFormSchema>;

export const pantryAdjustmentFormSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('CONSUME'),
    quantity: z.number().positive('Số lượng tiêu hao phải lớn hơn 0'),
    unit: z.string().trim().min(1, 'Vui lòng nhập đơn vị'),
    expectedVersion: z.number().int().positive(),
    reason: z.string().trim().max(1000).optional(),
  }),
  z.object({
    type: z.literal('RESTORE'),
    quantity: z.number().positive('Số lượng hoàn trả phải lớn hơn 0'),
    unit: z.string().trim().min(1, 'Vui lòng nhập đơn vị'),
    expectedVersion: z.number().int().positive(),
    reason: z.string().trim().max(1000).optional(),
  }),
  z.object({
    type: z.literal('ADJUST'),
    deltaQuantity: z.number().refine((val) => val !== 0, 'Số lượng điều chỉnh không được bằng 0'),
    unit: z.string().trim().min(1, 'Vui lòng nhập đơn vị'),
    expectedVersion: z.number().int().positive(),
    reason: z.string().trim().min(1, 'Vui lòng nhập lý do điều chỉnh sai lệch').max(1000),
  }),
]);

export type PantryAdjustmentFormData = z.infer<typeof pantryAdjustmentFormSchema>;

export const pantryMergeFormSchema = z.object({
  targetItemId: z.string().uuid('Vui lòng chọn nguyên liệu đích'),
  itemIds: z.array(z.string().uuid()).min(2, 'Cần chọn ít nhất 2 nguyên liệu để gộp'),
});

export type PantryMergeFormData = z.infer<typeof pantryMergeFormSchema>;
