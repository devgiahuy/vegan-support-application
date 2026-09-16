import { z } from 'zod';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';

export const dietSelectionSchema = z.object({
  dietPattern: z.enum([DietPattern.VEGAN, DietPattern.LACTO_OVO], {
    message: 'Vui lòng chọn kiểu ăn',
  }),
  practiceSchedule: z.enum([PracticeSchedule.PERMANENT, PracticeSchedule.PERIODIC], {
    message: 'Vui lòng chọn lịch thực hành',
  }),
  tradition: z.enum([Tradition.NONE, Tradition.BUDDHIST, Tradition.CHRISTIAN], {
    message: 'Vui lòng chọn truyền thống',
  }),
});

export type DietSelectionValues = z.infer<typeof dietSelectionSchema>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const dietConfirmSchema = z.object({
  rules: z
    .array(
      z.object({
        ruleDefinitionId: z.string().min(1),
        enabled: z.boolean(),
      })
    )
    .min(1, 'Bộ quy tắc trống, vui lòng tải lại xem trước'),
  scheduleDates: z.array(z.string().regex(DATE_RE, 'Ngày phải dạng YYYY-MM-DD')).optional(),
  allergies: z
    .array(
      z.object({
        allergenCode: z.string().min(1, 'Mã dị ứng không được trống'),
        label: z.string().optional(),
        severity: z.string().optional(),
      })
    )
    .optional(),
  ingredientExclusions: z
    .array(
      z.object({
        ingredientId: z.string().optional(),
        ingredientName: z.string().min(1, 'Tên nguyên liệu không được trống'),
        reason: z.string().optional(),
      })
    )
    .optional(),
});

export type DietConfirmValues = z.infer<typeof dietConfirmSchema>;
