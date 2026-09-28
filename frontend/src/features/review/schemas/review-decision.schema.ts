import { z } from 'zod';
import { ReviewDecisionEnum } from '../types/content-review.model';

export const reviewDecisionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Lý do phải có ít nhất 10 ký tự')
    .max(1000, 'Lý do không được vượt quá 1000 ký tự'),
});

export type ReviewDecisionValues = z.infer<typeof reviewDecisionSchema>;

export const adminContentReviewDecisionSchema = z.object({
  decision: z.nativeEnum(ReviewDecisionEnum),
  reason: z
    .string()
    .trim()
    .min(10, 'Lý do phải có ít nhất 10 ký tự')
    .max(1000, 'Lý do không được vượt quá 1000 ký tự'),
});

export type AdminContentReviewDecisionValues = z.infer<
  typeof adminContentReviewDecisionSchema
>;
