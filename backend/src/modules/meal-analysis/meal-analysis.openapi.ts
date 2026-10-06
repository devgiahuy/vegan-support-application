import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  mealAnalysisParamsSchema,
  mealAnalysisRequestSchema,
  mealAnalysisResponseSchema,
} from './meal-analysis.schemas.js';

const security = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];
const error = (schema: ZodType, description: string, codes: string[]) => ({
  description,
  content: {
    'application/json': {
      schema,
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
});

export function registerMealAnalysisOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const request = registry.register('MealAnalysisRequest', mealAnalysisRequestSchema);
  const response = registry.register('MealAnalysisResponse', mealAnalysisResponseSchema);
  registry.registerPath({
    method: 'post',
    path: '/api/v1/meal-plans/{id}/analyze',
    tags: ['Meal Analysis'],
    summary: 'Ph�n t�ch kh?u ph?n v� c�c di?m c?n luu � trong th?c don',
    description:
      'Ph�n t�ch m�n v� kh?u ph?n d� ch?n. C?nh b�o dinh du?ng d�nh cho ngu?i d�ng ch? t?p trung v�o ch?t d?m, ch?t xo, ch?t b�o v� tinh b?t, lu�n du?c di?n d?t l� s? li?u u?c t�nh. K?t qu? c� ti�u d?, gi?i th�ch v? tr�/ng�y/b?a, � nghia v� g?i � di?u ch?nh b?ng ti?ng Vi?t. Th�ng tin ngu?n v� m� v?n du?c gi? d? ki?m tra n?i b?; d? ?ng v� c�c y�u c?u an u?ng b?t bu?c kh�ng thay d?i.',
    operationId: 'analyzeMealPlan',
    security,
    request: {
      params: mealAnalysisParamsSchema,
      body: {
        required: true,
        content: {
          'application/json': {
            schema: request,
            example: {
              expectedPlanVersion: 2,
              items: [{ itemId: '10000000-0000-4000-8000-000000000001', servings: 1.5 }],
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'K?t qu? ph�n t�ch m?i v?i c?nh b�o v� g?i � d? hi?u cho ngu?i d�ng',
        content: { 'application/json': { schema: response } },
      },
      400: error(errorSchema, 'Selection ho?c portion kh�ng h?p l?', [
        'VALIDATION_ERROR',
        'MEAL_ANALYSIS_ITEM_UNFILLED',
        'MEAL_ANALYSIS_SOURCE_MISSING',
      ]),
      401: error(errorSchema, 'Y�u c?u dang nh?p', [
        'AUTH_REQUIRED',
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: error(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
      404: error(errorSchema, 'Kh�ng t�m th?y owned plan/item', ['NOT_FOUND']),
      409: error(errorSchema, 'Plan version d� thay d?i', ['MEAL_ANALYSIS_STALE']),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/meal-plans/{id}/analysis',
    tags: ['Meal Analysis'],
    summary: '�?c k?t qu? ph�n t�ch hi?n h�nh',
    description:
      'Tr? k?t qu? c�n ph� h?p v?i th?c don hi?n t?i. N?u m�n, kh?u ph?n ho?c th�ng tin li�n quan d� thay d?i, y�u c?u ph�n t�ch l?i thay v� tr? k?t qu? cu.',
    operationId: 'getCurrentMealAnalysis',
    security,
    request: { params: mealAnalysisParamsSchema },
    responses: {
      200: {
        description:
          'K?t qu? hi?n h�nh v?i n?i dung c?nh b�o ti?ng Vi?t v� th�ng tin ki?m tra n?i b?',
        content: { 'application/json': { schema: response } },
      },
      400: error(errorSchema, 'Meal plan ID kh�ng h?p l?', ['VALIDATION_ERROR']),
      401: error(errorSchema, 'Y�u c?u dang nh?p', [
        'AUTH_REQUIRED',
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: error(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
      404: error(errorSchema, 'Kh�ng c� owned plan/analysis', ['NOT_FOUND']),
      409: error(errorSchema, 'Analysis kh�ng c�n current', ['MEAL_ANALYSIS_STALE']),
    },
  });
}
