import { z } from 'zod';

export const postFormSchema = z.object({
  title: z
    .string()
    .min(5, 'Tiêu đề bài viết phải có ít nhất 5 ký tự')
    .max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn chủ đề tin tức'),
  coverImageUrl: z.string().url('Đường dẫn ảnh bìa không hợp lệ').or(z.literal('')).optional(),
  excerpt: z
    .string()
    .min(10, 'Tóm tắt bài viết cần ít nhất 10 ký tự')
    .max(500, 'Tóm tắt không được vượt quá 500 ký tự'),
  content: z.string().min(100, 'Nội dung bài viết chia sẻ kiến thức phải có ít nhất 100 ký tự'),
  tags: z.array(z.string()).default([]),
});

export type PostFormValues = z.infer<typeof postFormSchema>;
