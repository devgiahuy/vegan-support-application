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
      403: errorResponse(errorSchema, 'Khong phai owner/Admin', [
        'FORBIDDEN',
        'ACCOUNT_BANNED',
      ]),
      404: errorResponse(errorSchema, 'Khong tim thay recipe', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Recipe version da thay doi', [
        'CONTENT_VERSION_CONFLICT',
      ]),
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
}
