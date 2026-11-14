import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../../common/validation/zod.js';
import {
  adminEditSchema,
  adminListQuerySchema,
  geocodeQuerySchema,
  internalRestaurantIdParamsSchema,
  nearbyQuerySchema,
  restaurantIdParamsSchema,
  submitRestaurantSchema,
  reviewSchema,
  searchQuerySchema,
} from './restaurant.schemas.js';

const json = (schema: z.ZodTypeAny) => ({ 'application/json': { schema } });
const externalRef = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  provider: z.string(),
  placeId: z.string(),
  createdAt: z.iso.datetime(),
});
const record = z.object({
  id: z.string().uuid(),
  name: z.string(),
  normalizedName: z.string(),
  address: z.string(),
  normalizedAddress: z.string(),
  latitude: z.union([z.number(), z.string()]),
  longitude: z.union([z.number(), z.string()]),
  categories: z.array(z.string()),
  dietTags: z.array(z.string()),
  allergenFreeCodes: z.array(z.string()),
  excludedIngredients: z.array(z.string()),
  source: z.enum(['MEMBER', 'ADMIN']),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  submitterId: z.string().uuid().nullable(),
  reviewerId: z.string().uuid().nullable(),
  reviewedAt: z.iso.datetime().nullable(),
  reviewReason: z.string().nullable(),
  dataCheckedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  externalRefs: z.array(externalRef),
});
const place = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  categories: z.array(z.string()),
  rating: z.number().nullable(),
  reviewCount: z.number().nullable(),
  price: z.string().nullable(),
  openState: z.string().nullable(),
  operatingHours: z.record(z.string(), z.string()).nullable(),
  phone: z.string().nullable(),
  website: z.string().url().nullable(),
  thumbnailUrl: z.string().url().nullable(),
  mapsUrl: z.string().url().nullable(),
  dietTags: z.array(z.string()),
  source: z.enum(['INTERNAL', 'GOOGLE', 'SERPAPI', 'FAKE']),
  externalPlaceId: z.string().nullable(),
  attribution: z.string(),
  fetchedAt: z.iso.datetime().nullable(),
  distanceMeters: z.number().nullable(),
  matchReasons: z.array(z.string()),
  dietaryReviewed: z.boolean(),
});
const pageMeta = z.object({ page: z.number(), limit: z.number(), total: z.number() });
const discovery = z.object({
  success: z.literal(true),
  data: z.array(place),
  meta: pageMeta.extend({
    resultsTruncated: z
      .boolean()
      .describe('Provider page or result cap reached; result set may be incomplete'),
    externalDataUnavailable: z
      .boolean()
      .describe(
        'At least one provider query or page failed; successfully retrieved places remain available',
      ),
    externalResultsSuppressed: z
      .boolean()
      .describe(
        'Unreviewed external places omitted only when the request explicitly includes dietPattern; personal dietary profiles are not applied',
      ),
    provider: z.string(),
    providerResultLimit: z.number(),
    locationStored: z.literal(false),
  }),
});
const recordList = z.object({ success: z.literal(true), data: z.array(record), meta: pageMeta });
const recordEnvelope = z.object({ success: z.literal(true), data: record });
const auditEnvelope = z.object({
  success: z.literal(true),
  data: z.array(
    z.object({
      id: z.string().uuid(),
      restaurantId: z.string().uuid(),
      actorId: z.string().uuid(),
      action: z.string(),
      reason: z.string().nullable(),
      createdAt: z.iso.datetime(),
    }),
  ),
});
const placeEnvelope = z.object({ success: z.literal(true), data: place });
const geocode = z.object({
  success: z.literal(true),
  data: z
    .object({
      address: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      placeId: z.string().nullable(),
      attribution: z.string(),
    })
    .nullable(),
  externalDataUnavailable: z.boolean(),
});

export function registerRestaurantOpenApi(registry: OpenAPIRegistry, error: z.ZodTypeAny): void {
  const discoverySchema = registry.register('RestaurantDiscoveryResponse', discovery);
  const placeSchema = registry.register('RestaurantPlaceResponse', placeEnvelope);
  const recordSchema = registry.register('RestaurantRecordResponse', recordEnvelope);
  const listSchema = registry.register('RestaurantAdminListResponse', recordList);
  const geocodeSchema = registry.register('LocationGeocodeResponse', geocode);
  const auditSchema = registry.register('RestaurantAuditResponse', auditEnvelope);
  const errors = (statuses: number[]) =>
    Object.fromEntries(
      statuses.map((status) => [
        status,
        { description: 'Validation, authorization, or business error', content: json(error) },
      ]),
    );
  registry.registerPath({
    method: 'get',
    path: '/api/v1/restaurants/nearby',
    tags: ['Restaurants'],
    summary: 'Nearby approved internal and live provider places; explicit search filters only',
    description:
      'Coordinates are explicit. DEVICE requires locationConsent=true. Personal diet preferences, allergies, ingredient exclusions and tradition rules are not read or applied to restaurant discovery. An explicitly supplied dietPattern filters reviewed internal places and suppresses unreviewed provider results. Without that filter, guests and signed-in users search the same public place sources. Live provider content must be attributed in the UI and is not evidence of dietary or allergy compatibility. Nearby keyword queries run concurrently. SerpApi uses one viewport with map height equal to twice the requested radius and up to three pages per query, sharing MAPS_TIMEOUT_MS and retaining successful pages after a later failure. Advanced-filter queries use only the first page because provider pagination does not support these filters; further available pages set resultsTruncated=true. Results are deduplicated and radius-filtered. Default pagination has limit <= 20. Optional all=true returns the entire bounded discovery set in one response, ignoring page/limit slicing, with meta.page=1 and meta.limit=max(1,total). Discovery retains the existing 1000-internal/200-provider caps and partial/truncated notices; it is not an exhaustive directory of every real-world place. SerpApi list and single-place search responses are both supported, including string or array category types.',
    operationId: 'nearbyRestaurants',
    request: { query: nearbyQuerySchema },
    responses: {
      200: {
        description: 'Nearby results (all=true or paginated) and provider degradation',
        content: json(discoverySchema),
      },
      ...errors([400, 401, 403]),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/restaurants/search',
    tags: ['Restaurants'],
    summary: 'Search nearby restaurants and shops',
    description:
      'Only explicit query filters are applied; the caller dietary profile is ignored. An explicitly supplied dietPattern filters reviewed internal places and excludes unreviewed provider data. Provider price/rating/open filters are forwarded to SerpApi; filtered provider requests stop after the first page and signal truncation when more pages exist. Returned provider candidates must satisfy explicit minRating locally; missing ratings are excluded. Internal records without those assertions are excluded when such filters are requested. Optional all=true and partial/truncated metadata match nearby discovery; default paginated behavior remains compatible. SerpApi may return either a list or one place; both are normalized into the same result array.',
    operationId: 'searchRestaurants',
    request: { query: searchQuerySchema },
    responses: {
      200: {
        description: 'Search results (all=true or paginated)',
        content: json(discoverySchema),
      },
      ...errors([400, 401, 403]),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/restaurants/mine',
    tags: ['Restaurants'],
    summary: 'List own submissions and review outcomes',
    operationId: 'myRestaurantSubmissions',
    security: [{ bearerAuth: [] }],
    request: {
      query: registry.register('MyRestaurantQuery', adminListQuerySchema.omit({ status: true })),
    },
    responses: {
      200: { description: 'Owner-scoped submissions', content: json(listSchema) },
      ...errors([400, 401]),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/restaurants/{id}',
    tags: ['Restaurants'],
    summary: 'Get approved internal or live external place',
    description:
      'Public place details do not apply the caller dietary profile. Internal records must be APPROVED. External places resolve through the configured provider and remain dietary-unverified. distanceMeters is null because this endpoint receives no search origin; it must not imply the caller is at the restaurant.',
    operationId: 'getRestaurant',
    request: { params: restaurantIdParamsSchema },
    responses: {
      200: { description: 'Place details', content: json(placeSchema) },
      ...errors([400, 401, 404, 503]),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/restaurants',
    tags: ['Restaurants'],
    summary: 'Submit an untrusted place for admin review',
    operationId: 'submitRestaurant',
    security: [{ bearerAuth: [] }],
    request: { body: { content: json(submitRestaurantSchema) } },
    responses: {
      201: { description: 'Pending submission', content: json(recordSchema) },
      ...errors([400, 401, 403, 409]),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/location/geocode',
    tags: ['Location'],
    summary: 'Geocode an explicitly entered address without retaining it',
    description:
      'Resolves explicit addresses and landmarks from SerpApi list or single-place responses. Missing/invalid coordinates never fall back to a default location. A provider failure returns data=null and externalDataUnavailable=true.',
    operationId: 'geocodeAddress',
    request: { query: geocodeQuerySchema },
    responses: {
      200: {
        description: 'Live geocode or provider-degraded result',
        content: json(geocodeSchema),
      },
      ...errors([400, 401]),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/restaurants',
    tags: ['Restaurant Admin'],
    summary: 'List restaurant review queue',
    operationId: 'listAdminRestaurants',
    security: [{ bearerAuth: [] }],
    request: { query: adminListQuerySchema },
    responses: {
      200: { description: 'Paginated records', content: json(listSchema) },
      ...errors([400, 401, 403]),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/restaurants/{id}/history',
    tags: ['Restaurant Admin'],
    summary: 'Read immutable submission, review, and edit events',
    operationId: 'restaurantHistory',
    security: [{ bearerAuth: [] }],
    request: { params: internalRestaurantIdParamsSchema },
    responses: {
      200: { description: 'Chronological audit history', content: json(auditSchema) },
      ...errors([400, 401, 403, 404]),
    },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/restaurants/{id}/review',
    tags: ['Restaurant Admin'],
    summary: 'Approve or reject pending submission with reason',
    operationId: 'reviewRestaurant',
    security: [{ bearerAuth: [] }],
    request: { params: internalRestaurantIdParamsSchema, body: { content: json(reviewSchema) } },
    responses: {
      200: { description: 'Reviewed record', content: json(recordSchema) },
      ...errors([400, 401, 403, 409]),
    },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/restaurants/{id}',
    tags: ['Restaurant Admin'],
    summary: 'Edit internal place and reviewed dietary attestations',
    operationId: 'editRestaurant',
    security: [{ bearerAuth: [] }],
    request: { params: internalRestaurantIdParamsSchema, body: { content: json(adminEditSchema) } },
    responses: {
      200: { description: 'Edited record', content: json(recordSchema) },
      ...errors([400, 401, 403, 404, 409]),
    },
  });
}
