import { z } from 'zod';
import { VideoSource } from '@/common/enums';

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

export const videoFormSchema = z
  .object({
    title: z
      .string()
      .min(5, 'Tiêu đề video phải có ít nhất 5 ký tự')
      .max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
    categoryId: z.string().min(1, 'Vui lòng chọn danh mục cho video'),
    coverImageUrl: z.string().url('Đường dẫn ảnh bìa không hợp lệ').or(z.literal('')).optional(),
    coverMedia: z
      .object({
        publicId: z.string(),
        mimeType: z.string(),
        bytes: z.number(),
      })
      .nullable()
      .optional(),
    videoUrl: z.string().min(1, 'Vui lòng tải lên tệp video hoặc dán link YouTube'),
    videoSource: z.nativeEnum(VideoSource),
    videoMedia: z
      .object({
        publicId: z.string(),
        mimeType: z.string(),
        bytes: z.number(),
      })
      .nullable()
      .optional(),
    durationSeconds: z.number().int().min(0).optional(),
    description: z.string().min(20, 'Mô tả video cần ít nhất 20 ký tự để hệ thống duyệt nội dung'),
  })
  .superRefine((values, ctx) => {
    if (values.videoSource === VideoSource.YOUTUBE && !isYouTubeUrl(values.videoUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['videoUrl'],
        message: 'Đường dẫn YouTube chưa đúng định dạng (youtube.com hoặc youtu.be).',
      });
    }
  });

export type VideoFormValues = z.infer<typeof videoFormSchema>;
