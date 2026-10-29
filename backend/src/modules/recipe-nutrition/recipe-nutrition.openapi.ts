import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  nutritionEstimateResponseSchema,
  nutritionHistoryQuerySchema,
  nutritionHistoryResponseSchema,
  nutritionPreviewRequestSchema,
  nutritionRecalculateRequestSchema,
  nutritionStatusResponseSchema,
  postIdParamsSchema,
} from './recipe-nutrition.schemas.js';
import {
  reviewNutritionOverrideRequestSchema,
  reviewNutritionPanelResponseSchema,
  revisionIdParamsSchema,
} from './recipe-nutrition-review.schemas.js';

const authenticated = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];
const optionalAuthenticated = [{}, ...authenticated];

function errorResponse(errorSchema: ZodType, description: string, codes: string[]) {
  return {
    description,
    content: {
      'application/json': {
        schema: errorSchema,
        examples: Object.fromEntries(
          codes.map((code) => [
            code,
            {
              value: {
                success: false,
                error: {
                  code,
                  message: description,
                  requestId: '0781d468-5eb1-4bd0-9671-e4ca33b76462',
                },
              },
            },
          ]),
        ),
      },
    },
  };
}

export function registerRecipeNutritionOpenApi(
  registry: OpenAPIRegistry,
  errorSchema: ZodType,
): void {
  const previewRequest = registry.register(
    'RecipeNutritionPreviewRequest',
    nutritionPreviewRequestSchema,
  );
  const recalculateRequest = registry.register(
    'RecipeNutritionRecalculateRequest',
    nutritionRecalculateRequestSchema,
  );
  const estimateResponse = registry.register(
    'RecipeNutritionEstimateResponse',
    nutritionEstimateResponseSchema,
  );
  const historyResponse = registry.register(
    'RecipeNutritionHistoryResponse',
    nutritionHistoryResponseSchema,
  );
  const statusResponse = registry.register(
    'RecipeNutritionStatusResponse',
    nutritionStatusResponseSchema,
  );

  registry.registerPath({
    method: 'post',
    path: '/api/v1/posts/{id}/nutrition/preview',
    tags: ['Recipe Nutrition'],
    summary: 'Preview cooking-aware nutrition estimate without saving',
    description:
      'Calculates deterministic recipe nutrition from canonical ingredients, reviewed household conversions, edible portions, structured steps, yield factors and retention factors. AI fallback is optional, provider-adapter only, labeled AI_ESTIMATED, and never writes canonical food data.',
    operationId: 'previewRecipeNutrition',
    security: optionalAuthenticated,
    request: {
      params: postIdParamsSchema,
      body: {
        required: true,
        content: {
          'application/json': {
            schema: previewRequest,
            example: { useAiFallback: false },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Partial or complete unsaved estimate with provenance and disclaimer',
        content: { 'application/json': { schema: estimateResponse } },
      },
      400: errorResponse(errorSchema, 'Recipe khong hop le de tinh nutrition', [
        'VALIDATION_ERROR',
        'INVALID_CONTENT',
        'INVALID_SERVINGS',
      ]),
      401: errorResponse(errorSchema, 'Access token khong hop le neu duoc gui kem', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      404: errorResponse(errorSchema, 'Khong tim thay recipe co the truy cap', ['NOT_FOUND']),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/posts/{id}/nutrition/recalculate',
    tags: ['Recipe Nutrition'],
    summary: 'Save a new current cooking-aware nutrition estimate',
    description:
      'Owner/Admin only. Saves a new version, moves the previous current estimate to history, and marks mismatched historical estimates stale. AI provider failure falls back to deterministic partial output.',
    operationId: 'recalculateRecipeNutrition',
    security: authenticated,
    request: {
      params: postIdParamsSchema,
      body: {
        required: true,
        content: {
          'application/json': {
            schema: recalculateRequest,
            example: { useAiFallback: true, expectedPostVersion: 1 },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Saved estimate version',
        content: { 'application/json': { schema: estimateResponse } },
      },
      400: errorResponse(errorSchema, 'Recipe khong hop le de tinh nutrition', [
        'VALIDATION_ERROR',
        'INVALID_CONTENT',
        'INVALID_SERVINGS',
      ]),
      401: errorResponse(errorSchema, 'Yeu cau dang nhap', ['AUTH_REQUIRED']),
      403: errorResponse(errorSchema, 'Khong phai owner/Admin', ['FORBIDDEN', 'ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Khong tim thay recipe', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Recipe version da thay doi', ['CONTENT_VERSION_CONFLICT']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/posts/{id}/nutrition/current',
    tags: ['Recipe Nutrition'],
    summary: 'Get current saved nutrition estimate',
    operationId: 'getCurrentRecipeNutrition',
    security: optionalAuthenticated,
    request: { params: postIdParamsSchema },
    responses: {
      200: {
        description: 'Current saved estimate',
        content: { 'application/json': { schema: estimateResponse } },
      },
      401: errorResponse(errorSchema, 'Access token khong hop le neu duoc gui kem', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      404: errorResponse(errorSchema, 'Recipe hoac estimate khong ton tai', [
        'NOT_FOUND',
        'NUTRITION_DATA_INCOMPLETE',
      ]),
      409: errorResponse(errorSchema, 'Estimate da stale va can tinh lai', [
        'NUTRITION_ESTIMATE_STALE',
      ]),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/posts/{id}/nutrition/history',
    tags: ['Recipe Nutrition'],
    summary: 'List saved nutrition estimate history',
    operationId: 'listRecipeNutritionHistory',
    security: optionalAuthenticated,
    request: { params: postIdParamsSchema, query: nutritionHistoryQuerySchema },
    responses: {
      200: {
        description: 'Paginated estimate versions',
        content: { 'application/json': { schema: historyResponse } },
      },
      401: errorResponse(errorSchema, 'Access token khong hop le neu duoc gui kem', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      404: errorResponse(errorSchema, 'Khong tim thay recipe co the truy cap', ['NOT_FOUND']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/posts/{id}/nutrition/status',
    tags: ['Recipe Nutrition'],
    summary: 'Get nutrition estimate freshness and latest AI job status',
    operationId: 'getRecipeNutritionStatus',
    security: optionalAuthenticated,
    request: { params: postIdParamsSchema },
    responses: {
      200: {
        description: 'Current estimate freshness and latest AI fallback job',
        content: { 'application/json': { schema: statusResponse } },
      },
      401: errorResponse(errorSchema, 'Access token khong hop le neu duoc gui kem', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      404: errorResponse(errorSchema, 'Khong tim thay recipe co the truy cap', ['NOT_FOUND']),
    },
  });

  const reviewPanelResponse = registry.register(
    'RecipeNutritionReviewPanelResponse',
    reviewNutritionPanelResponseSchema,
  );
  const reviewOverrideRequest = registry.register(
    'RecipeNutritionReviewOverrideRequest',
    reviewNutritionOverrideRequestSchema,
  );
  const reviewerAuthErrors = errorResponse(errorSchema, 'Authentication required', [
    'AUTH_REQUIRED',
    'INVALID_ACCESS_TOKEN',
    'TOKEN_EXPIRED',
    'STALE_ACCESS_TOKEN',
  ]);
  const reviewerEditErrors = {
    401: reviewerAuthErrors,
    403: errorResponse(errorSchema, 'Reviewer role, self-review or Admin-only review boundary', [
      'FORBIDDEN',
      'ACCOUNT_BANNED',
      'SELF_APPROVAL_FORBIDDEN',
      'ADMIN_REVIEW_REQUIRED',
    ]),
    404: errorResponse(errorSchema, 'Revision not found', ['NOT_FOUND']),
    409: errorResponse(errorSchema, 'Revision is no longer awaiting review', [
      'REVIEW_ALREADY_DECIDED',
      'CONTENT_STATE_CONFLICT',
      'REVIEW_CONFLICT',
    ]),
  };

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/content-review/{id}/nutrition',
    tags: ['Content Review Admin'],
    summary: 'Reviewer nutrition panel for a submitted recipe revision',
    description:
      'Admin or Contributor. Five per-serving values (calories, proteinGrams, carbsGrams, fatGrams, fiberGrams) with source label (CANONICAL_CALCULATED, AI_ESTIMATED, VERIFIED_OVERRIDE for reviewer edits), confidence, ingredients that reviewed data could not cover, the latest AI gap-filling job state, the previous approved values (reference only, never carried over) and the edit audit. canApprove is true when every value is present, even while an AI job runs or after it failed. canEdit mirrors the publication decision rules. Path id is the revision id.',
    operationId: 'getRecipeNutritionReviewPanel',
    security: authenticated,
    request: { params: revisionIdParamsSchema },
    responses: {
      200: {
        description: 'Nutrition review panel',
        content: { 'application/json': { schema: reviewPanelResponse } },
      },
      400: errorResponse(errorSchema, 'Revision is not a structured recipe', [
        'VALIDATION_ERROR',
        'INVALID_CONTENT',
      ]),
      401: reviewerAuthErrors,
      403: errorResponse(errorSchema, 'Reviewer role required', ['FORBIDDEN', 'ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Revision not found', ['NOT_FOUND']),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/content-review/{id}/nutrition',
    tags: ['Content Review Admin'],
    summary: 'Reviewer sets or clears per-serving nutrition overrides',
    description:
      'A number sets a reviewer override (VERIFIED_OVERRIDE); null clears it back to the calculated estimate; omitted keys are unchanged. Calories are rounded to an integer, grams to two decimals. Each change appends an audit row with actor, time, reason and the effective value/origin before and after. Overrides apply only to this revision and never change canonical ingredient data.',
    operationId: 'updateRecipeNutritionReviewOverrides',
    security: authenticated,
    request: {
      params: revisionIdParamsSchema,
      body: { required: true, content: { 'application/json': { schema: reviewOverrideRequest } } },
    },
    responses: {
      200: {
        description: 'Updated nutrition review panel',
        content: { 'application/json': { schema: reviewPanelResponse } },
      },
      400: errorResponse(errorSchema, 'Invalid values or not a recipe', [
        'VALIDATION_ERROR',
        'INVALID_CONTENT',
      ]),
      ...reviewerEditErrors,
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/content-review/{id}/nutrition/recalculate',
    tags: ['Content Review Admin'],
    summary: 'Reviewer recalculates nutrition ("AI tính lại")',
    description:
      'Recomputes the estimate from current reviewed food data and keeps reviewer overrides. If data is still insufficient, cancels any active job and queues a new asynchronous AI gap-filling job (1 attempt + 3 automatic retries after 1, 5 and 15 minutes, then FAILED). AI calls are system-paid, never charge a user quota, and are traced as NUTRITION governance events. AI output is labelled AI_ESTIMATED, applies only to this revision estimate and never writes IngredientFoodProfile or nutrient values.',
    operationId: 'recalculateRecipeNutritionReview',
    security: authenticated,
    request: { params: revisionIdParamsSchema },
    responses: {
      202: {
        description: 'Recalculated panel; aiJob shows the queued job when one was needed',
        content: { 'application/json': { schema: reviewPanelResponse } },
      },
      400: errorResponse(errorSchema, 'Revision is not a structured recipe', [
        'VALIDATION_ERROR',
        'INVALID_CONTENT',
      ]),
      ...reviewerEditErrors,
    },
  });
}
