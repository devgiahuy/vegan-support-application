import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  generateRecipeDraftEnvelopeSchema,
  generateRecipeDraftRequestSchema,
} from './recipe-draft.schemas.js';

export function registerRecipeDraftOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const request = registry.register('GenerateRecipeDraftRequest', generateRecipeDraftRequestSchema);
  const response = registry.register(
    'GenerateRecipeDraftResponse',
    generateRecipeDraftEnvelopeSchema,
  );
  registry.registerPath({
    method: 'post',
    path: '/api/v1/recipe-drafts/generate',
    tags: ['Content', 'AI'],
    summary: 'Generate an editable recipe draft from ingredient names and optional basic information',
    description:
      'Authenticated preview only. Title and description are optional; missing values are suggested from the ingredient names. Supplied values and servings and preparation/cooking times are preserved; omitted values are suggested by AI. No post or pantry mutation. Ingredient names remain in input order. The client must let the user edit the returned draft and then call POST /api/v1/posts to save it as DRAFT. Images are not analyzed. No nutrition values are invented.',
    operationId: 'generateRecipeDraft',
    security: [{ BearerAuth: [] }, { AccessTokenCookie: [] }],
    request: { body: { content: { 'application/json': { schema: request } } } },
    responses: {
      200: {
        description: 'Editable recipe draft suggestion',
        content: { 'application/json': { schema: response } },
      },
      400: {
        description: 'Invalid input',
        content: { 'application/json': { schema: errorSchema } },
      },
      401: {
        description: 'Authentication required',
        content: { 'application/json': { schema: errorSchema } },
      },
      503: {
        description: 'RECIPE_DRAFT_UNAVAILABLE or RECIPE_DRAFT_GENERATION_FAILED',
        content: { 'application/json': { schema: errorSchema } },
      },
    },
  });
}
