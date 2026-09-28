import { z } from 'zod';
import { ContributorApprovalBasis } from '@/common/enums';

export const MAX_EXPERIENCE_LENGTH = 2000;
export const MAX_REFERENCE_LINKS = 5;

export const submitApplicationSchema = z
  .object({
    claimedApprovalBasis: z.enum(
      [
        ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
        ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
      ],
      { message: 'Vui lòng chọn căn cứ đề xuất hợp lệ.' }
    ),
    organizationClaim: z.string().trim().max(200, 'Tên tổ chức tối đa 200 ký tự.').optional(),
    experience: z
      .string()
      .trim()
      .min(20, 'Mô tả kinh nghiệm tối thiểu 20 ký tự.')
      .max(MAX_EXPERIENCE_LENGTH, `Tối đa ${MAX_EXPERIENCE_LENGTH} ký tự.`),
    referenceLinks: z
      .array(z.string().trim().url('Link phải là URL hợp lệ.'))
      .max(MAX_REFERENCE_LINKS, `Tối đa ${MAX_REFERENCE_LINKS} links.`),
  })
  .superRefine((data, ctx) => {
    if (
      data.claimedApprovalBasis === ContributorApprovalBasis.ORGANIZATION_AFFILIATION &&
      (!data.organizationClaim || data.organizationClaim.length < 3)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['organizationClaim'],
        message: 'Vui lòng nhập tên tổ chức/hội đoàn liên kết (tối thiểu 3 ký tự).',
      });
    }
  });

export type SubmitApplicationFormValues = z.infer<typeof submitApplicationSchema>;

export const reviewApplicationSchema = z.discriminatedUnion('decision', [
  z.object({
    decision: z.literal('APPROVE'),
    approvalBasis: z.nativeEnum(ContributorApprovalBasis, {
      message: 'Vui lòng chọn căn cứ phê duyệt chính thức.',
    }),
    reviewNote: z.string().trim().min(5, 'Ghi chú thẩm định tối thiểu 5 ký tự.'),
  }),
  z.object({
    decision: z.literal('REJECT'),
    reviewNote: z.string().trim().min(10, 'Từ chối bắt buộc có lý do tối thiểu 10 ký tự.'),
  }),
]);

export type ReviewApplicationFormValues = z.infer<typeof reviewApplicationSchema>;

export const inviteContributorSchema = z.object({
  userId: z.string().trim().uuid('Mã người dùng không hợp lệ (phải là UUID).'),
  reason: z.string().trim().min(10, 'Lý do mời tối thiểu 10 ký tự.').max(500, 'Tối đa 500 ký tự.'),
});

export type InviteContributorFormValues = z.infer<typeof inviteContributorSchema>;

export const revokeContributorSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Lý do thu hồi quyền tối thiểu 10 ký tự.')
    .max(500, 'Tối đa 500 ký tự.'),
});

export type RevokeContributorFormValues = z.infer<typeof revokeContributorSchema>;
