import { z } from 'zod';
import { AiArtifactType, AiArtifactVisibility } from '@/common/enums';

export const createAiArtifactSchema = z.object({
  type: z.nativeEnum(AiArtifactType, {
    message: 'Loại tri thức AI không hợp lệ.',
  }),
  sourceId: z.string().uuid('Mã nguồn phân tích AI không hợp lệ.'),
  title: z
    .string()
    .trim()
    .min(3, 'Tiêu đề phải có ít nhất 3 ký tự.')
    .max(160, 'Tiêu đề không được vượt quá 160 ký tự.'),
  summary: z
    .string()
    .trim()
    .min(3, 'Tóm tắt phải có ít nhất 3 ký tự.')
    .max(1000, 'Tóm tắt không được vượt quá 1000 ký tự.'),
  authorAnonymous: z.boolean(),
});

export type CreateAiArtifactFormData = z.infer<typeof createAiArtifactSchema>;

export const updateAiArtifactVisibilitySchema = z.object({
  visibility: z.nativeEnum(AiArtifactVisibility, {
    message: 'Chế độ hiển thị không hợp lệ.',
  }),
  expectedLifecycleVersion: z.number().int().positive(),
});

export type UpdateAiArtifactVisibilityFormData = z.infer<typeof updateAiArtifactVisibilitySchema>;

export const submitAiArtifactSchema = z.object({
  expectedLifecycleVersion: z.number().int().positive(),
});

export type SubmitAiArtifactFormData = z.infer<typeof submitAiArtifactSchema>;

export const publicAiArtifactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.nativeEnum(AiArtifactType).optional(),
});
