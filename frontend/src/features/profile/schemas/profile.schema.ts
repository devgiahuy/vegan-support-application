import { z } from 'zod';

const httpUrlSchema = z
  .string()
  .max(2048, 'URL ảnh quá dài')
  .refine(
    (v) => {
      const t = v.trim();
      // Form cho phép `blob:`/`data:image` để xem trước khi upload mock;
      // lúc submit form sẽ chặn và yêu cầu URL http(s) thật từ Cloudinary.
      return (
        t.length === 0 ||
        /^https?:\/\/.+/.test(t) ||
        t.startsWith('blob:') ||
        t.startsWith('data:image')
      );
    },
    {
      message: 'URL ảnh phải bắt đầu bằng http:// hoặc https://',
    }
  );

export const basicProfileSchema = z
  .object({
    displayName: z.string().max(100, 'Tên hiển thị tối đa 100 ký tự').optional(),
    avatarUrl: httpUrlSchema.optional(),
  })
  .superRefine((d, ctx) => {
    const name = (d.displayName ?? '').trim();
    const avatar = (d.avatarUrl ?? '').trim();
    if (name.length > 0 && name.length < 2) {
      ctx.addIssue({
        code: 'custom',
        message: 'Tên hiển thị ít nhất 2 ký tự',
        path: ['displayName'],
      });
    }
    if (name.length === 0 && avatar.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Cần thay đổi ít nhất tên hiển thị hoặc ảnh đại diện',
        path: ['displayName'],
      });
    }
  });

export type BasicProfileFormValues = z.infer<typeof basicProfileSchema>;
