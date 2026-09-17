import { z } from 'zod';
import { MealPlanGoal } from '@/common/enums';

const MONDAY_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` có phải Thứ Hai không (tính theo UTC để tránh lệch múi giờ). */
export function isMonday(dateStr: string): boolean {
  if (!MONDAY_DATE_RE.test(dateStr)) return false;
  const date = new Date(`${dateStr}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.getUTCDay() === 1;
}

/** Thứ Hai của tuần hiện tại (`YYYY-MM-DD`, UTC). */
export function currentWeekMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff)
  );
  const month = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const date = String(monday.getUTCDate()).padStart(2, '0');
  return `${monday.getUTCFullYear()}-${month}-${date}`;
}

export const generateMealPlanSchema = z.object({
  weekStart: z
    .string()
    .regex(MONDAY_DATE_RE, 'Ngày bắt đầu phải đúng định dạng YYYY-MM-DD.')
    .refine(isMonday, 'Tuần thực đơn phải bắt đầu từ Thứ Hai.'),
  goal: z.nativeEnum(MealPlanGoal, { message: 'Vui lòng chọn mục tiêu thực đơn.' }),
  supersedesMealPlanId: z
    .string()
    .uuid('Phiên bản thay thế không hợp lệ.')
    .optional()
    .or(z.literal('')),
});

export type GenerateMealPlanFormValues = z.infer<typeof generateMealPlanSchema>;
