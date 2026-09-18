import { z } from 'zod';

export const MIN_RADIUS_M = 500;
export const MAX_RADIUS_M = 50000;
export const DEFAULT_RADIUS_M = 5000;
export const MAX_DISHES = 10;

export const locationQuerySchema = z.object({
  lat: z.number().min(-90, 'Vĩ độ từ -90 đến 90.').max(90, 'Vĩ độ từ -90 đến 90.').optional(),
  lng: z
    .number()
    .min(-180, 'Kinh độ từ -180 đến 180.')
    .max(180, 'Kinh độ từ -180 đến 180.')
    .optional(),
  addressText: z.string().trim().max(500).default(''),
  radiusM: z
    .number()
    .min(MIN_RADIUS_M, `Bán kính tối thiểu ${MIN_RADIUS_M}m.`)
    .max(MAX_RADIUS_M, `Bán kính tối đa ${MAX_RADIUS_M}m.`)
    .default(DEFAULT_RADIUS_M),
  query: z.string().trim().max(200).default(''),
});

export type LocationQueryFormValues = z.infer<typeof locationQuerySchema>;

export const submitRestaurantSchema = z.object({
  name: z.string().trim().min(2, 'Vui lòng nhập tên quán.').max(200),
  address: z.string().trim().min(5, 'Vui lòng nhập địa chỉ đầy đủ.').max(500),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  dishes: z.array(z.string().trim().min(1)).max(MAX_DISHES, `Tối đa ${MAX_DISHES} món.`),
  note: z.string().trim().max(2000).optional(),
});

export type SubmitRestaurantFormValues = z.infer<typeof submitRestaurantSchema>;

export const reviewRestaurantSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT'], { message: 'Vui lòng chọn quyết định.' }),
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do.').max(2000),
});

export type ReviewRestaurantFormValues = z.infer<typeof reviewRestaurantSchema>;
