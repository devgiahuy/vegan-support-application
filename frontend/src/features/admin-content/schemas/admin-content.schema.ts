/**
 * Schema zod của khu vực Quản lý nội dung.
 *
 * Được dùng THẬT qua `react-hook-form` + `@hookform/resolvers/zod` trong các hộp
 * thoại quản trị. Không khai báo schema chết (khác với `admin-catalog/schemas/*.schema.ts`
 * — research.md R-07).
 */

import { z } from 'zod';
import { PostType } from '@/common/enums';

/** Lý do ẩn: bắt buộc, tối thiểu 10 ký tự, tối đa 2 000 (FR-025). */
export const ADMIN_HIDE_REASON_MIN = 10;
export const ADMIN_HIDE_REASON_MAX = 2000;

export const adminHideReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(ADMIN_HIDE_REASON_MIN, `Vui lòng nhập lý do với ít nhất ${ADMIN_HIDE_REASON_MIN} ký tự.`)
    .max(ADMIN_HIDE_REASON_MAX, `Lý do không được vượt quá ${ADMIN_HIDE_REASON_MAX} ký tự.`),
});
export type AdminHideReasonValues = z.infer<typeof adminHideReasonSchema>;

/** Loại nội dung dùng chung cho cả ba biểu mẫu. */
export const adminContentTypeSchema = z.object({
  type: z.enum([PostType.RECIPE, PostType.BLOG, PostType.VIDEO], {
    message: 'Vui lòng chọn loại nội dung.',
  }),
});
export type AdminContentTypeValues = z.infer<typeof adminContentTypeSchema>;

/** Lý do từ chối khi quản trị viên gửi duyệt — tuỳ chọn, tối đa 2 000 ký tự. */
export const adminSubmitNoteSchema = z.object({
  note: z.string().trim().max(2000, 'Ghi chú không được vượt quá 2000 ký tự.').optional(),
});
export type AdminSubmitNoteValues = z.infer<typeof adminSubmitNoteSchema>;
