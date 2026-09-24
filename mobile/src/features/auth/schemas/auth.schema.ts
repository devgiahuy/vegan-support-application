import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu ít nhất 8 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu cần ít nhất 1 chữ hoa')
  .regex(/[0-9]/, 'Mật khẩu cần ít nhất 1 chữ số');

/** Mỗi dòng (không rỗng) trong ô link tham khảo phải là URL hợp lệ — khớp `z.string().url()` backend. */
function referenceLinksAreValid(raw: string | undefined): boolean {
  const lines = (raw ?? '').split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length > 5) return false;
  return lines.every((line) => {
    try {
      new URL(line);
      return true;
    } catch {
      return false;
    }
  });
}

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Tên hiển thị ít nhất 2 ký tự')
      .max(100, 'Tên hiển thị tối đa 100 ký tự'),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    // Nguyện vọng contributor (tùy chọn, Phase 14 unified contract). Khi bật,
    // `claimedApprovalBasis` + `experience` bắt buộc; `organizationClaim` bắt buộc
    // riêng cho basis ORGANIZATION_AFFILIATION và KHÔNG được gửi cho basis còn lại
    // (backend `.strict()` từ chối field thừa).
    wantsContributor: z.boolean(),
    claimedApprovalBasis: z
      .enum(['ORGANIZATION_AFFILIATION', 'PLATFORM_TRACK_RECORD'], {
        message: 'Vui lòng chọn căn cứ nguyện vọng',
      })
      .optional(),
    organizationClaim: z
      .string()
      .max(500, 'Tên/mô tả tổ chức tối đa 500 ký tự')
      .optional(),
    experience: z.string().max(2000, 'Kinh nghiệm tối đa 2000 ký tự').optional(),
    referenceLinks: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.password !== d.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mật khẩu nhập lại không khớp',
        path: ['confirmPassword'],
      });
    }
    if (d.wantsContributor) {
      if (!d.claimedApprovalBasis) {
        ctx.addIssue({
          code: 'custom',
          message: 'Vui lòng chọn căn cứ nguyện vọng',
          path: ['claimedApprovalBasis'],
        });
      }
      if (d.claimedApprovalBasis === 'ORGANIZATION_AFFILIATION') {
        const trimmed = d.organizationClaim?.trim() ?? '';
        if (trimmed.length < 2) {
          ctx.addIssue({
            code: 'custom',
            message: 'Vui lòng ghi tên hoặc mô tả tổ chức (ít nhất 2 ký tự)',
            path: ['organizationClaim'],
          });
        }
      }
      const experienceLength = d.experience?.trim().length ?? 0;
      if (experienceLength === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Vui lòng mô tả kinh nghiệm của bạn',
          path: ['experience'],
        });
      } else if (experienceLength < 20) {
        ctx.addIssue({
          code: 'custom',
          message: 'Kinh nghiệm cần mô tả ít nhất 20 ký tự',
          path: ['experience'],
        });
      }
      if (!referenceLinksAreValid(d.referenceLinks)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Mỗi dòng phải là một đường link hợp lệ (tối đa 5 link)',
          path: ['referenceLinks'],
        });
      }
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
