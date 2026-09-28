import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  createMealProgramRequestSchema,
  mealProgramListQuerySchema,
  mealProgramListResponseSchema,
  mealProgramParamsSchema,
  mealProgramResponseSchema,
  patchMealProgramRequestSchema,
} from './meal-program.schemas.js';

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
  401: errorResponse(schema, 'Valid access token required', [
    'AUTH_REQUIRED',
    'INVALID_ACCESS_TOKEN',
    'TOKEN_EXPIRED',
  ]),
  403: errorResponse(schema, 'Account is banned', ['ACCOUNT_BANNED']),
});

export function registerMealProgramOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const createRequest = registry.register(
    'CreateMealProgramRequest',
    createMealProgramRequestSchema,
  );
  const patchRequest = registry.register('PatchMealProgramRequest', patchMealProgramRequestSchema);
  const response = registry.register('MealProgramResponse', mealProgramResponseSchema);
  const listResponse = registry.register('MealProgramListResponse', mealProgramListResponseSchema);
  registry.registerPath({
    method: 'post',
    path: '/api/v1/meal-programs',
    tags: ['Meal Programs'],
    operationId: 'createMealProgram',
    security: authenticated,
    summary: 'Generate a bounded multi-week meal program',
    description:
      'Creates 2-12 ordered weekly plans in the requested IANA timezone. Generation is resumable by idempotency key; week failures are retained as PARTIAL/FAILED state and successful alternatives remain drafts until confirmation.',
    request: {
      body: { required: true, content: { 'application/json': { schema: createRequest } } },
    },
    responses: {
      201: {
        description: 'Program snapshots and cross-week analysis',
        content: { 'application/json': { schema: response } },
      },
      400: errorResponse(errorSchema, 'Invalid request or configured limit exceeded', [
        'VALIDATION_ERROR',
        'MEAL_PROGRAM_LIMIT_EXCEEDED',
      ]),
      ...authErrors(errorSchema),
      409: errorResponse(errorSchema, 'Profile, schedule, or idempotency conflict', [
        'HEALTH_PROFILE_INCOMPLETE',
        'DIET_SCHEDULE_REQUIRED',
        'MEAL_PROGRAM_IDEMPOTENCY_CONFLICT',
      ]),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/meal-programs',
    tags: ['Meal Programs'],
    operationId: 'listMealPrograms',
    security: authenticated,
    summary: 'List owned meal programs',
    request: { query: mealProgramListQuerySchema },
    responses: {
      200: {
        description: 'Paginated program summaries',
        content: { 'application/json': { schema: listResponse } },
      },
      400: errorResponse(errorSchema, 'Invalid query', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/meal-programs/{id}',
    tags: ['Meal Programs'],
    operationId: 'getMealProgram',
    security: authenticated,
    summary: 'Read an owned program and weekly snapshots',
    request: { params: mealProgramParamsSchema },
    responses: {
      200: { description: 'Program detail', content: { 'application/json': { schema: response } } },
      400: errorResponse(errorSchema, 'Invalid ID', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Owned program not found', ['NOT_FOUND']),
    },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/meal-programs/{id}',
    tags: ['Meal Programs'],
    operationId: 'mutateMealProgram',
    security: authenticated,
    summary: 'Edit, regenerate, reanalyze, or confirm a program',
    description:
      'Actions are UPDATE_METADATA, SELECT_ALTERNATIVE, REGENERATE_WEEK, REANALYZE, and CONFIRM. Every mutation is idempotent and version checked. Week edits invalidate later projections. Confirmed program content is immutable.',
    request: {
      params: mealProgramParamsSchema,
      body: { required: true, content: { 'application/json': { schema: patchRequest } } },
    },
    responses: {
      200: {
        description: 'Updated program',
        content: { 'application/json': { schema: response } },
      },
      400: errorResponse(errorSchema, 'Invalid mutation', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Program or alternative not found', [
        'NOT_FOUND',
        'MEAL_PROGRAM_ALTERNATIVE_NOT_FOUND',
      ]),
      409: errorResponse(errorSchema, 'Mutation conflict', [
        'MEAL_PROGRAM_VERSION_CONFLICT',
        'MEAL_PROGRAM_IDEMPOTENCY_CONFLICT',
        'MEAL_PROGRAM_CONFIRMED_IMMUTABLE',
        'MEAL_PROGRAM_NOT_CONFIRMABLE',
        'MEAL_PROGRAM_REGENERATION_LIMIT',
      ]),
    },
  });
}
