import { z } from 'zod';

export const MAX_VERIFY_NOTE_LENGTH = 2000;

/** Xác nhận đã hiểu phạm vi công khai (checkbox bắt buộc checked). */
export const shareConfirmSchema = z.object({
  acknowledged: z.literal(true, { message: 'Vui lòng xác nhận bạn hiểu liên kết là công khai.' }),
});

export type ShareConfirmFormValues = z.infer<typeof shareConfirmSchema>;

export const verifyNoteSchema = z.object({
  note: z.string().trim().min(1, 'Vui lòng nhập ghi chú kiểm chứng.').max(MAX_VERIFY_NOTE_LENGTH),
});

export type VerifyNoteFormValues = z.infer<typeof verifyNoteSchema>;
