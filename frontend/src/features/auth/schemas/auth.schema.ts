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

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Tên hiển thị ít nhất 2 ký tự')
      .max(100, 'Tên hiển thị tối đa 100 ký tự'),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    // Nguyện vọng contributor (tùy chọn). Khi bật, `requestedType` + `experience` bắt buộc.
    wantsContributor: z.boolean(),
    requestedType: z
      .enum(['EXPERIENCED_PRACTITIONER', 'NUTRITION_EXPERT'], {
        message: 'Vui lòng chọn loại nguyện vọng',
      })
      .optional(),
    experience: z.string().max(1000, 'Kinh nghiệm tối đa 1000 ký tự').optional(),
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
      if (!d.requestedType) {
        ctx.addIssue({
          code: 'custom',
          message: 'Vui lòng chọn loại nguyện vọng',
          path: ['requestedType'],
        });
      }
      if (!d.experience || d.experience.trim().length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Vui lòng mô tả kinh nghiệm của bạn',
          path: ['experience'],
        });
      }
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
