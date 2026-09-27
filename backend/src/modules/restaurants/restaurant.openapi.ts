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
  dietTags: z.array(z.string()),
  source: z.enum(['INTERNAL', 'GOOGLE', 'FAKE']),
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
    resultsTruncated: z.boolean(),
    externalDataUnavailable: z.boolean(),
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
    summary:
      'Nearby approved internal and live provider places; hard diet filtering precedes ranking',
    description:
      'Coordinates are explicit. DEVICE requires locationConsent=true. Provider results are dietary-unverified and excluded when hard constraints apply. Google content is live only and must be attributed in the UI.',
    operationId: 'nearbyRestaurants',
    request: { query: nearbyQuerySchema },
    responses: {
      200: {
        description: 'Paginated nearby results and provider degradation',
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
    operationId: 'searchRestaurants',
    request: { query: searchQuerySchema },
    responses: {
      200: { description: 'Paginated search results', content: json(discoverySchema) },
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
