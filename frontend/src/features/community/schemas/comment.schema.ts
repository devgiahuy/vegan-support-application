import { z } from 'zod';

export const MAX_COMMENT_LENGTH = 2000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập bình luận.')
    .max(MAX_COMMENT_LENGTH, `Bình luận tối đa ${MAX_COMMENT_LENGTH} ký tự.`),
  /** UUID bình luận gốc khi reply; reply không được reply tiếp (check ở form). */
  parentId: z.string().regex(UUID_RE, 'Bình luận cha không hợp lệ.').optional().or(z.literal('')),
});

export type CommentFormValues = z.infer<typeof commentSchema>;

export const ratingSchema = z.object({
  taste: z.number().int().min(1, 'Vui lòng chấm điểm vị.').max(5),
  difficulty: z.number().int().min(1, 'Vui lòng chấm độ khó.').max(5),
});

export type RatingFormValues = z.infer<typeof ratingSchema>;
