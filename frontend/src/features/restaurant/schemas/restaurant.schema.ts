import { z } from 'zod';

/** Backend `radiusMeters` là `z.coerce.number().int().min(100).max(50000).default(5000)`. */
export const MIN_RADIUS_M = 100;
export const MAX_RADIUS_M = 50000;
export const DEFAULT_RADIUS_M = 5000;

/** Backend `searchQuerySchema.q` là `z.string().trim().min(2).max(160)`. */
export const MAX_QUERY_LENGTH = 160;

export const addressGeocodeSchema = z.object({
  address: z
    .string()
    .trim()
    .min(3, 'Vui lòng nhập địa chỉ cụ thể hơn (tối thiểu 3 ký tự).')
    .max(500),
});

export type AddressGeocodeFormValues = z.infer<typeof addressGeocodeSchema>;

/**
 * Bám `submitRestaurantSchema` của backend (`.strict()`):
 * `name` 2..180, `address` 5..500, `latitude`/`longitude` BẮT BUỘC,
 * `dietTags` chỉ nhận VEGAN | LACTO_OVO | BUDDHIST | CHRISTIAN.
 */
export const submitRestaurantSchema = z.object({
  name: z.string().trim().min(2, 'Vui lòng nhập tên quán (tối thiểu 2 ký tự).').max(180),
  address: z.string().trim().min(5, 'Vui lòng nhập địa chỉ đầy đủ (tối thiểu 5 ký tự).').max(500),
  latitude: z.number('Vui lòng chọn vị trí trên bản đồ.').min(-90).max(90),
  longitude: z.number('Vui lòng chọn vị trí trên bản đồ.').min(-180).max(180),
  categories: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  dietTags: z.array(z.enum(['VEGAN', 'LACTO_OVO', 'BUDDHIST', 'CHRISTIAN'])).optional(),
  allergenFreeCodes: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  excludedIngredients: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
});

export type SubmitRestaurantFormValues = z.infer<typeof submitRestaurantSchema>;

/** Ngoài phạm vi redesign trang khám phá — giữ nguyên cho luồng quản trị. */
export const reviewRestaurantSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT'], { message: 'Vui lòng chọn quyết định.' }),
    reason: z.string().trim().max(2000).optional(),
  })
  .refine((data) => data.decision !== 'REJECT' || (data.reason && data.reason.trim().length >= 3), {
    message: 'Vui lòng nhập lý do từ chối (tối thiểu 3 ký tự).',
    path: ['reason'],
  });

export type ReviewRestaurantFormValues = z.infer<typeof reviewRestaurantSchema>;
