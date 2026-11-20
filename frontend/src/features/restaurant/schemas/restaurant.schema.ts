import { z } from 'zod';

/** Web discovery choices; the backend's wider contract remains available to other clients. */
export const MIN_RADIUS_M = 100;
export const MAX_RADIUS_M = 5000;
export const DEFAULT_RADIUS_M = 3000;
export const RESTAURANT_RADIUS_OPTIONS = [100, 300, 500, 1000, 3000, 5000] as const;

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
  latitude: z
    .number({ message: 'Vui lòng nhập vĩ độ của quán.' })
    .min(-90, 'Vĩ độ phải từ -90 đến 90.')
    .max(90, 'Vĩ độ phải từ -90 đến 90.')
    .refine((v) => v !== 0, 'Vui lòng nhập vĩ độ khác 0.'),
  longitude: z
    .number({ message: 'Vui lòng nhập kinh độ của quán.' })
    .min(-180, 'Kinh độ phải từ -180 đến 180.')
    .max(180, 'Kinh độ phải từ -180 đến 180.')
    .refine((v) => v !== 0, 'Vui lòng nhập kinh độ khác 0.'),
  categories: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  dietTags: z.array(z.enum(['VEGAN', 'LACTO_OVO', 'BUDDHIST', 'CHRISTIAN'])).optional(),
  allergenFreeCodes: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  excludedIngredients: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
});

export type SubmitRestaurantFormValues = z.infer<typeof submitRestaurantSchema>;

/** Ngoài phạm vi redesign trang khám phá — giữ nguyên cho luồng quản trị. */
export const reviewRestaurantSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT'], { message: 'Vui lòng chọn quyết định.' }),
  reason: z.string().trim().min(3, 'Vui lòng nhập lý do quyết định (tối thiểu 3 ký tự).').max(1000),
});

export type ReviewRestaurantFormValues = z.infer<typeof reviewRestaurantSchema>;
