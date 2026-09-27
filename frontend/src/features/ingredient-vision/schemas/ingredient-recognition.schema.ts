import { z } from 'zod';

/**
 * Zod validation schema cho form chỉnh sửa ứng viên nguyên liệu nhận diện từ ảnh.
 */
export const updateCandidateFormSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    ingredientId: z.string().uuid().nullable().optional(),
    detectedName: z
      .string()
      .trim()
      .min(1, 'Tên nguyên liệu không được để trống')
      .max(160, 'Tên quá dài'),
    quantity: z
      .number()
      .positive('Số lượng phải là số dương')
      .max(999_999_999, 'Số lượng quá lớn')
      .nullable()
      .optional(),
    unit: z.string().trim().max(40, 'Đơn vị quá dài').nullable().optional(),
    freshnessObservation: z
      .string()
      .trim()
      .max(1000, 'Ghi chú độ tươi tối đa 1000 ký tự')
      .nullable()
      .optional(),
    confidence: z.number().min(0).max(1).optional(),
    decision: z.enum(['KEEP', 'REJECT']).optional(),
  })
  .refine(
    (data) => {
      const hasQuantity = data.quantity !== null && data.quantity !== undefined;
      const hasUnit = data.unit !== null && data.unit !== undefined && data.unit.trim().length > 0;
      return (hasQuantity && hasUnit) || (!hasQuantity && !hasUnit);
    },
    {
      message: 'Số lượng và đơn vị đo lường phải cùng được nhập hoặc cùng để trống',
      path: ['unit'],
    }
  );

export type UpdateCandidateFormData = z.infer<typeof updateCandidateFormSchema>;
