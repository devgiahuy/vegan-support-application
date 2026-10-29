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
    summary: 'Generate an editable recipe draft from a title, description and ingredient names',
    description:
      'Authenticated preview only. No post or pantry mutation. Ingredient names remain in input order; amounts, units, servings, times and steps are AI suggestions with subjective confidence. The client must let the user edit the returned draft and then call POST /api/v1/posts to save it as DRAFT. Images are not analyzed. No nutrition values are invented. Since 2026-10-29 the request may carry optional servings, prepTimeMinutes and cookTimeMinutes entered by the author: amounts are sized for those servings, the returned draft keeps the author values, and data.suggestedTiming carries the AI own servings/time estimate for display only.',
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
