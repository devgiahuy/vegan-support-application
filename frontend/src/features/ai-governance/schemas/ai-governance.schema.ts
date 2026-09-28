import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const metricsQuerySchema = z
  .object({
    from: z.string().regex(DATE_RE, 'Từ ngày phải định dạng YYYY-MM-DD.'),
    to: z.string().regex(DATE_RE, 'Đến ngày phải định dạng YYYY-MM-DD.'),
    feature: z.string().trim().max(100).default(''),
  })
  .refine((values) => values.from <= values.to, {
    message: 'Từ ngày phải trước hoặc bằng đến ngày.',
    path: ['from'],
  });

export type MetricsQueryFormValues = z.infer<typeof metricsQuerySchema>;

export const toggleFeatureSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do bật/tắt.').max(2000),
});

export type ToggleFeatureFormValues = z.infer<typeof toggleFeatureSchema>;
