import { DietPattern, RestaurantStatus } from '@prisma/client';
import { z } from '../../common/validation/zod.js';

const coordinate = z.coerce.number().finite();
export const latitudeSchema = coordinate.min(-90).max(90);
export const longitudeSchema = coordinate.min(-180).max(180);
const tags = z.array(z.string().trim().min(1).max(100)).max(30);

export const restaurantInputSchema = z
  .object({
    name: z.string().trim().min(2).max(180),
    address: z.string().trim().min(5).max(500),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    categories: tags.default([]),
    dietTags: z.array(z.enum(['VEGAN', 'LACTO_OVO', 'BUDDHIST', 'CHRISTIAN'])).default([]),
    allergenFreeCodes: tags.default([]),
    excludedIngredients: tags.default([]),
    externalPlaceId: z.string().trim().min(1).max(255).optional(),
  })
  .strict();
export const submitRestaurantSchema = restaurantInputSchema.omit({ externalPlaceId: true });

const locationQuery = z
  .object({
    lat: latitudeSchema.optional(),
    lng: longitudeSchema.optional(),
    north: latitudeSchema.optional(),
    south: latitudeSchema.optional(),
    east: longitudeSchema.optional(),
    west: longitudeSchema.optional(),
    radiusMeters: z.coerce.number().int().min(100).max(50000).default(5000),
    page: z.coerce.number().int().min(1).max(100).default(1),
    limit: z.coerce.number().int().min(1).max(20).default(20),
    dietPattern: z.nativeEnum(DietPattern).optional(),
    locationSource: z.enum(['MANUAL', 'DEVICE']).default('MANUAL'),
    locationConsent: z.enum(['true', 'false']).optional(),
  })
  .strict()
  .superRefine((v, context) => {
    if ((v.lat === undefined) !== (v.lng === undefined))
      context.addIssue({ code: 'custom', message: 'lat and lng must be supplied together' });
    const bounds = [v.north, v.south, v.east, v.west];
    if (bounds.some((x) => x !== undefined) && bounds.some((x) => x === undefined))
      context.addIssue({
        code: 'custom',
        message: 'north, south, east, west must all be supplied',
      });
    if (v.north !== undefined && v.south !== undefined && v.north <= v.south)
      context.addIssue({ code: 'custom', message: 'north must exceed south' });
    if (v.east !== undefined && v.west !== undefined && v.east <= v.west)
      context.addIssue({ code: 'custom', message: 'east must exceed west' });
  });

export const nearbyQuerySchema = locationQuery;
export const searchQuerySchema = locationQuery.safeExtend({
  q: z.string().trim().min(2).max(160),
  minPrice: z.coerce.number().int().min(0).max(4).optional(),
  maxPrice: z.coerce.number().int().min(0).max(4).optional(),
  minRating: z.coerce.number().min(2).max(4.5).optional(),
  openState: z.enum(['now', '24h']).optional(),
  openOnDay: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']).optional(),
  openAtHour: z.coerce.number().int().min(0).max(23).optional(),
});
export const restaurantIdParamsSchema = z
  .object({
    id: z.union([
      z.string().uuid(),
      z.string().regex(/^(google|serpapi|fake):[A-Za-z0-9_-]{1,255}$/),
    ]),
  })
  .strict();
export const internalRestaurantIdParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const adminListQuerySchema = z
  .object({
    status: z.nativeEnum(RestaurantStatus).default(RestaurantStatus.PENDING),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export const mineListQuerySchema = adminListQuerySchema.omit({ status: true });
export const reviewSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    reason: z.string().trim().min(3).max(1000),
  })
  .strict();
export const adminEditSchema = restaurantInputSchema.safeExtend({
  reason: z.string().trim().min(3).max(1000),
});
export const geocodeQuerySchema = z.object({ address: z.string().trim().min(5).max(500) }).strict();

export type RestaurantInput = z.infer<typeof submitRestaurantSchema>;
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type AdminEditInput = z.infer<typeof adminEditSchema>;
