import { z } from 'zod';
import { AiVerificationAdminActionType, AiVerificationConclusion } from '@/common/enums';

export const createAiVerificationSchema = z
  .object({
    expectedArtifactVersion: z.number().int().positive(),
    conclusion: z.nativeEnum(AiVerificationConclusion, {
      message: 'Vui lòng chọn kết luận thẩm định.',
    }),
    scope: z
      .string()
      .trim()
      .min(3, 'Phạm vi thẩm định phải có ít nhất 3 ký tự.')
      .max(500, 'Phạm vi thẩm định không được vượt quá 500 ký tự.'),
    evidenceNote: z
      .string()
      .trim()
      .min(3, 'Ghi chú bằng chứng và lập luận phải có ít nhất 3 ký tự.')
      .max(2000, 'Ghi chú không được vượt quá 2000 ký tự.'),
    correction: z.string().trim().max(2000).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.conclusion === AiVerificationConclusion.CORRECTION_NEEDED &&
      (!val.correction || val.correction.trim().length < 3)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['correction'],
        message: 'Vui lòng cung cấp nội dung chỉnh lý cụ thể (ít nhất 3 ký tự).',
      });
    }
  });

export type CreateAiVerificationFormData = z.infer<typeof createAiVerificationSchema>;

export const adminAiVerificationActionSchema = z
  .object({
    action: z.nativeEnum(AiVerificationAdminActionType, {
      message: 'Vui lòng chọn loại hành động can thiệp.',
    }),
    expectedVersion: z.number().int().positive(),
    reason: z
      .string()
      .trim()
      .min(3, 'Lý do can thiệp kiểm toán phải có ít nhất 3 ký tự.')
      .max(2000, 'Lý do không được vượt quá 2000 ký tự.'),
    conclusion: z.nativeEnum(AiVerificationConclusion).optional(),
    scope: z.string().trim().min(3).max(500).optional(),
    evidenceNote: z.string().trim().min(3).max(2000).optional(),
    correction: z.string().trim().max(2000).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.action === AiVerificationAdminActionType.OVERRIDE) {
      if (!val.conclusion) {
        ctx.addIssue({
          code: 'custom',
          path: ['conclusion'],
          message: 'Ghi đè kiểm chứng yêu cầu phải có kết luận mới.',
        });
      }
      if (!val.scope || val.scope.trim().length < 3) {
        ctx.addIssue({
          code: 'custom',
          path: ['scope'],
          message: 'Phạm vi thẩm định mới phải có ít nhất 3 ký tự.',
        });
      }
      if (!val.evidenceNote || val.evidenceNote.trim().length < 3) {
        ctx.addIssue({
          code: 'custom',
          path: ['evidenceNote'],
          message: 'Ghi chú bằng chứng mới phải có ít nhất 3 ký tự.',
        });
      }
      if (
        val.conclusion === AiVerificationConclusion.CORRECTION_NEEDED &&
        (!val.correction || val.correction.trim().length < 3)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['correction'],
          message: 'Vui lòng cung cấp nội dung chỉnh lý cụ thể (ít nhất 3 ký tự).',
        });
      }
    }
  });

export type AdminAiVerificationActionFormData = z.infer<typeof adminAiVerificationActionSchema>;
