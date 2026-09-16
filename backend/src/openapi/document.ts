import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { errorResponseSchema } from '../common/schemas/api-envelope.schemas.js';
import {
  healthResponseSchema,
  healthUnavailableResponseSchema,
} from '../modules/health/health.schemas.js';
import { registerAuthOpenApi } from '../modules/auth/auth.openapi.js';
import { registerProfileOpenApi } from '../modules/profile/profile.openapi.js';
import { registerCatalogOpenApi } from '../modules/catalog/catalog.openapi.js';
import { registerContentOpenApi } from '../modules/content/content.openapi.js';
import { registerCommunityOpenApi } from '../modules/community/community.openapi.js';
import { registerContributorOpenApi } from '../modules/contributors/contributor.openapi.js';
import { registerModerationOpenApi } from '../modules/moderation/moderation.openapi.js';
import { registerRecommendationOpenApi } from '../modules/recommendations/recommendation.openapi.js';
import { registerMealPlanOpenApi } from '../modules/meal-plans/meal-plan.openapi.js';

const registry = new OpenAPIRegistry();

const registeredErrorResponse = registry.register('ErrorResponse', errorResponseSchema);
const registeredHealthResponse = registry.register('HealthResponse', healthResponseSchema);
const registeredHealthUnavailableResponse = registry.register(
  'HealthUnavailableResponse',
  healthUnavailableResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/api/v1/health',
  tags: ['Foundation'],
  summary: 'Kiểm tra trạng thái API và PostgreSQL',
  operationId: 'getHealth',
  responses: {
    200: {
      description: 'API và PostgreSQL hoạt động bình thường',
      content: { 'application/json': { schema: registeredHealthResponse } },
    },
    503: {
      description: 'PostgreSQL không khả dụng',
      content: { 'application/json': { schema: registeredHealthUnavailableResponse } },
    },
  },
});

registerAuthOpenApi(registry, registeredErrorResponse);
registerProfileOpenApi(registry, registeredErrorResponse);
registerCatalogOpenApi(registry, registeredErrorResponse);
registerContentOpenApi(registry, registeredErrorResponse);
registerCommunityOpenApi(registry, registeredErrorResponse);
registerContributorOpenApi(registry, registeredErrorResponse);
registerModerationOpenApi(registry, registeredErrorResponse);
registerRecommendationOpenApi(registry, registeredErrorResponse);
registerMealPlanOpenApi(registry, registeredErrorResponse);

const generator = new OpenApiGeneratorV31(registry.definitions);

const generatedDocument = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Vegan Support Application API',
    version: '0.1.0',
    description: 'REST API contract for the Vegan Support Application.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local development' }],
  tags: [
    { name: 'Foundation', description: 'Service health and foundation contract' },
    { name: 'Auth', description: 'Authentication and refresh-session lifecycle' },
    { name: 'Users', description: 'Authenticated user contract' },
    { name: 'Diet Rules', description: 'Versioned diet and tradition rule confirmation' },
    { name: 'Categories', description: 'Public active category tree' },
    { name: 'Ingredients', description: 'Canonical ingredient discovery and alias resolution' },
    { name: 'Catalog Admin', description: 'Admin-only category and ingredient management' },
    { name: 'Content', description: 'Revisioned Recipe, Blog, and Video content' },
    { name: 'Community', description: 'Comments, votes, ratings, and bookmarks' },
    { name: 'Recommendations', description: 'Consent-aware behavior events and recipe ranking' },
    { name: 'Meal Plans', description: 'Deterministic weekly plans, swaps and shopping lists' },
    {
      name: 'Contributors',
      description: 'Contributor applications and approved subtype status',
    },
    { name: 'Contributor Admin', description: 'Admin-only Contributor application review' },
    { name: 'Moderation', description: 'Content review queue and user reports' },
    { name: 'Moderation Admin', description: 'Admin decisions, user and comment moderation' },
    { name: 'Uploads', description: 'Safe Cloudinary signed-upload configuration' },
  ],
});

const lockedMutationResponse = {
  description: 'Tài khoản LOCKED không được thực hiện mutation',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: 'Tài khoản đang bị khóa',
          requestId: '0781d468-5eb1-4bd0-9671-e4ca33b76462',
        },
      },
    },
  },
};

for (const pathItem of Object.values(generatedDocument.paths ?? {})) {
  for (const method of ['post', 'put', 'patch', 'delete'] as const) {
    const operation = pathItem?.[method];
    if (operation?.security?.length) {
      operation.responses ??= {};
      operation.responses['423'] = lockedMutationResponse;
    }
  }
}

export const openApiDocument = generatedDocument;
