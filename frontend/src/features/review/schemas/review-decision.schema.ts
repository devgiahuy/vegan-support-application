import { z } from 'zod';

export const reviewDecisionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Lý do phải có ít nhất 10 ký tự')
    .max(2000, 'Lý do không được vượt quá 2000 ký tự'),
});

export type ReviewDecisionValues = z.infer<typeof reviewDecisionSchema>;
