import { z } from 'zod';
import { MemberStatus, ModerationDecision } from '@/common/enums';

export const MAX_MODERATION_REASON_LENGTH = 2000;

const reasonField = z
  .string()
  .trim()
  .min(10, 'Vui lòng nhập lý do ít nhất 10 ký tự (bắt buộc để kiểm toán).')
  .max(MAX_MODERATION_REASON_LENGTH, `Lý do tối đa ${MAX_MODERATION_REASON_LENGTH} ký tự.`);

export const resolveReportSchema = z.object({
  decision: z.nativeEnum(ModerationDecision, { message: 'Vui lòng chọn quyết định.' }),
  reason: reasonField,
});

export type ResolveReportFormValues = z.infer<typeof resolveReportSchema>;

export const userStatusSchema = z.object({
  status: z.nativeEnum(MemberStatus, { message: 'Vui lòng chọn trạng thái.' }),
  reason: reasonField,
});

export type UserStatusFormValues = z.infer<typeof userStatusSchema>;

export const commentStatusSchema = z.object({
  status: z.enum(['VISIBLE', 'HIDDEN'], { message: 'Vui lòng chọn trạng thái.' }),
  reason: reasonField,
});

export type CommentStatusFormValues = z.infer<typeof commentStatusSchema>;
