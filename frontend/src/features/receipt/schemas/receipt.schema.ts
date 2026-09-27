import { z } from 'zod';

export const updateReceiptCandidateSchema = z
  .object({
    expectedVersion: z
      .number()
      .int()
      .positive({ message: 'expectedVersion phải là số nguyên dương' }),
    ingredientId: z.string().uuid().nullable().optional(),
    detectedName: z
      .string()
      .trim()
      .min(1, 'Tên mặt hàng không được để trống')
      .max(160, 'Tên tối đa 160 ký tự')
      .optional(),
    lineText: z.string().trim().max(300, 'Dòng chữ tối đa 300 ký tự').optional(),
    quantity: z
      .number()
      .positive('Số lượng phải lớn hơn 0')
      .max(999_999_999, 'Số lượng quá lớn')
      .nullable()
      .optional(),
    unit: z
      .string()
      .trim()
      .min(1, 'Đơn vị không được để trống')
      .max(40, 'Đơn vị tối đa 40 ký tự')
      .nullable()
      .optional(),
    unitPrice: z
      .number()
      .nonnegative('Đơn giá không được âm')
      .max(999_999_999_999, 'Đơn giá quá lớn')
      .nullable()
      .optional(),
    lineTotal: z
      .number()
      .nonnegative('Thành tiền không được âm')
      .max(999_999_999_999, 'Thành tiền quá lớn')
      .nullable()
      .optional(),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, 'Mã tiền tệ phải là 3 ký tự (VND, USD...)')
      .nullable()
      .optional(),
    confidence: z.number().min(0).max(1).optional(),
    uncertaintyNote: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự').nullable().optional(),
    decision: z.enum(['KEEP', 'REJECT']).optional(),
  })
  .refine(
    (data) => {
      const hasQty = data.quantity !== undefined && data.quantity !== null;
      const hasUnit = data.unit !== undefined && data.unit !== null && data.unit.trim().length > 0;
      if (hasQty && !hasUnit) return false;
      if (!hasQty && hasUnit) return false;
      return true;
    },
    {
      message: 'Vui lòng cung cấp cả số lượng và đơn vị đo lường, hoặc để trống cả hai',
      path: ['unit'],
    }
  );

export type UpdateReceiptCandidateFormValues = z.infer<typeof updateReceiptCandidateSchema>;
