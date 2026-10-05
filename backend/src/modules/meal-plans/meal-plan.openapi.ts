import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  deleteMealPlanQuerySchema,
  deleteMealPlanResponseSchema,
  generateMealPlanRequestSchema,
  mealPlanItemParamsSchema,
  mealPlanListQuerySchema,
  mealPlanListResponseSchema,
  mealPlanParamsSchema,
  mealPlanResponseSchema,
  manualAddMealPlanItemRequestSchema,
  swapMealPlanItemRequestSchema,
} from './meal-plan.schemas.js';

const authenticated = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];
const errorResponse = (schema: ZodType, description: string, codes: string[]) => ({
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
const authErrors = (schema: ZodType) => ({
  401: errorResponse(schema, 'Y�u c?u access token h?p l?', [
    'AUTH_REQUIRED',
    'INVALID_ACCESS_TOKEN',
    'TOKEN_EXPIRED',
  ]),
  403: errorResponse(schema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
});

export function registerMealPlanOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const generateRequest = registry.register(
    'GenerateMealPlanRequest',
    generateMealPlanRequestSchema,
  );
  const swapRequest = registry.register('SwapMealPlanItemRequest', swapMealPlanItemRequestSchema);
  const manualAddRequest = registry.register(
    'ManualAddMealPlanItemRequest',
    manualAddMealPlanItemRequestSchema,
  );
  const planResponse = registry.register('MealPlanResponse', mealPlanResponseSchema);
  const listResponse = registry.register('MealPlanListResponse', mealPlanListResponseSchema);
  const deleteResponse = registry.register('DeleteMealPlanResponse', deleteMealPlanResponseSchema);

  registry.registerPath({
    method: 'post',
    path: '/api/v1/meal-plans/generate',
    tags: ['Meal Plans'],
    summary: 'T?o ho?c regenerate weekly meal plan',
    description:
      'T?o Monday�Sunday, 3 b?a/ng�y. MAINTAIN/LOSE/GAIN d�ng TDEE � goal factor; protein, fiber, fat v� carbohydrate l� target u?c t�nh t? c?u h�nh. Backend hard-filter tru?c scoring, uu ti�n tolerance nhung v?n d�ng candidate hard-compatible ngo�i tolerance. Ch? UNFILLED khi kh�ng c�n candidate hard-compatible v� lu�n tr? unresolved reason. seed cho k?t qu? deterministic; supersedesMealPlanId li�n k?t version regenerate.',
    operationId: 'generateMealPlan',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: generateRequest,
            example: {
              weekStart: '2026-09-21',
              goal: 'MAINTAIN',
              idempotencyKey: 'plan-2026-09-21-maintain-01',
              seed: 'demo-week-39',
            },
          },
        },
      },
    },
    responses: {
      201: {
        description:
          'Th?c don tu?n m?i c�ng danh s�ch mua s?m, t�m t?t d? hi?u v� c�c luu � d�nh cho ngu?i d�ng',
        content: { 'application/json': { schema: planResponse } },
      },
      400: errorResponse(errorSchema, 'Payload generate kh�ng h?p l?', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      409: errorResponse(errorSchema, 'Profile, schedule, supersedes ho?c idempotency conflict', [
        'HEALTH_PROFILE_INCOMPLETE',
        'DIET_SCHEDULE_REQUIRED',
        'MEAL_PLAN_SUPERSEDES_INVALID',
        'MEAL_PLAN_IDEMPOTENCY_CONFLICT',
      ]),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/meal-plans',
    tags: ['Meal Plans'],
    summary: 'List meal plan versions c?a current user',
    operationId: 'listMealPlans',
    security: authenticated,
    request: { query: mealPlanListQuerySchema },
    responses: {
      200: {
        description: 'Meal plan summaries ph�n trang',
        content: { 'application/json': { schema: listResponse } },
      },
      400: errorResponse(errorSchema, 'Query list kh�ng h?p l?', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/meal-plans/{id}',
    tags: ['Meal Plans'],
    summary: '�?c meal plan version thu?c current user',
    operationId: 'getMealPlan',
    security: authenticated,
    request: { params: mealPlanParamsSchema },
    responses: {
      200: {
        description:
          'Existing 21-item list plus additive Monday�Sunday day/slot view, explicit unresolved state, estimated four-macro targets/totals, shopping list and analysis',
        content: { 'application/json': { schema: planResponse } },
      },
      400: errorResponse(errorSchema, 'Meal plan ID kh�ng h?p l?', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Kh�ng t�m th?y owned meal plan', ['NOT_FOUND']),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/meal-plans/{id}/items/{itemId}/swap',
    tags: ['Meal Plans'],
    summary: 'Swap m?t meal slot an to�n',
    description:
      'Ch? ch?n published eligible Recipe c�n th?a hard constraints c?a ng�y. Uu ti�n calorie trong �100 kcal so v?i m�n cu; n?u kh�ng c� d�ng �20% target v� tr? warning. expectedVersion ch?ng concurrent update, idempotencyKey ch?ng apply l?p.',
    operationId: 'swapMealPlanItem',
    security: authenticated,
    request: {
      params: mealPlanItemParamsSchema,
      body: {
        required: true,
        content: { 'application/json': { schema: swapRequest } },
      },
    },
    responses: {
      200: {
        description: 'Meal plan sau swap v� shopping list d� t�nh l?i',
        content: { 'application/json': { schema: planResponse } },
      },
      400: errorResponse(errorSchema, 'Payload swap kh�ng h?p l?', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Kh�ng t�m th?y plan ho?c item thu?c user', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Kh�ng c� candidate ho?c version/idempotency conflict', [
        'NO_ELIGIBLE_RECIPE',
        'MEAL_PLAN_VERSION_CONFLICT',
        'MEAL_PLAN_IDEMPOTENCY_CONFLICT',
      ]),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/meal-plans/{id}/items/{itemId}/manual-add',
    tags: ['Meal Plans'],
    summary: 'Th�m recipe ho?c private custom meal v�o slot',
    description:
      'H? th?ng ki?m tra d? ?ng, nguy�n li?u c?n tr�nh, ch? d? an v� quy t?c truy?n th?ng tru?c khi luu. M�n ph� h?p v?n du?c luu khi c�c ch? s? ch?t d?m, ch?t xo, ch?t b�o ho?c tinh b?t u?c t�nh l?ch kh?i kho?ng m?c ti�u; c�c luu � n�y ch? l� g?i � di?u ch?nh v� kh�ng ch?n thao t�c.',
    operationId: 'manualAddMealPlanItem',
    security: authenticated,
    request: {
      params: mealPlanItemParamsSchema,
      body: { required: true, content: { 'application/json': { schema: manualAddRequest } } },
    },
    responses: {
      200: {
        description: 'Meal plan v� analysis d� c?p nh?t',
        content: { 'application/json': { schema: planResponse } },
      },
      400: errorResponse(errorSchema, 'Payload manual-add kh�ng h?p l?', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Kh�ng t�m th?y owned plan, slot ho?c source', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Hard constraint, version ho?c idempotency conflict', [
        'MEAL_PLAN_HARD_CONSTRAINT_VIOLATION',
        'MEAL_PLAN_VERSION_CONFLICT',
        'MEAL_PLAN_IDEMPOTENCY_CONFLICT',
      ]),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/meal-plans/{id}',
    tags: ['Meal Plans'],
    summary: 'Soft-delete owned meal plan',
    operationId: 'deleteMealPlan',
    security: authenticated,
    request: { params: mealPlanParamsSchema, query: deleteMealPlanQuerySchema },
    responses: {
      200: {
        description: 'Delete idempotent; plan kh�ng c�n xu?t hi?n trong list/detail',
        content: { 'application/json': { schema: deleteResponse } },
      },
      400: errorResponse(errorSchema, 'ID ho?c expectedVersion kh�ng h?p l?', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Kh�ng t�m th?y owned meal plan', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Meal plan version conflict', ['MEAL_PLAN_VERSION_CONFLICT']),
    },
  });
}
