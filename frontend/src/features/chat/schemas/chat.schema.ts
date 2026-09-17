import { z } from 'zod';

export const MAX_CHAT_MESSAGE_LENGTH = 2000;

export const chatComposerSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập câu hỏi.')
    .max(MAX_CHAT_MESSAGE_LENGTH, `Câu hỏi tối đa ${MAX_CHAT_MESSAGE_LENGTH} ký tự.`),
});

export type ChatComposerFormValues = z.infer<typeof chatComposerSchema>;
