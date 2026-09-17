import { z } from 'zod';
import { ContributorType } from '@/common/enums';

export const MAX_EXPERIENCE_LENGTH = 2000;
export const MAX_REFERENCE_LINKS = 5;

export const submitApplicationSchema = z.object({
  requestedType: z.nativeEnum(ContributorType, { message: 'Vui lòng chọn nhóm đóng góp.' }),
  experience: z
    .string()
    .trim()
    .min(20, 'Mô tả kinh nghiệm tối thiểu 20 ký tự.')
    .max(MAX_EXPERIENCE_LENGTH, `Tối đa ${MAX_EXPERIENCE_LENGTH} ký tự.`),
  referenceLinks: z
    .array(z.string().trim().url('Link phải là URL hợp lệ.'))
    .max(MAX_REFERENCE_LINKS, `Tối đa ${MAX_REFERENCE_LINKS} links.`),
});

export type SubmitApplicationFormValues = z.infer<typeof submitApplicationSchema>;

export const reviewApplicationSchema = z.discriminatedUnion('decision', [
  z.object({
    decision: z.literal('APPROVE'),
    contributorType: z.nativeEnum(ContributorType, { message: 'Vui lòng chọn nhóm chính thức.' }),
    approvalBasis: z.string().trim().min(20, 'Cơ sở phê duyệt tối thiểu 20 ký tự.'),
    reviewNote: z.string().trim().min(10, 'Ghi chú tối thiểu 10 ký tự.'),
  }),
  z.object({
    decision: z.literal('REJECT'),
    reviewNote: z.string().trim().min(10, 'Từ chối bắt buộc có ghi chú tối thiểu 10 ký tự.'),
  }),
]);

export type ReviewApplicationFormValues = z.infer<typeof reviewApplicationSchema>;
