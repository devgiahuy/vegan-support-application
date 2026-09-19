import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  adminFoodDataRecordQuerySchema,
  commitFoodDataImportRequestSchema,
  createFoodDataRecordRequestSchema,
  foodDataIdParamsSchema,
  foodDataImportResponseSchema,
  foodDataListResponseSchema,
  foodDataReadQuerySchema,
  foodDataRecordKindQuerySchema,
  foodDataRecordResponseSchema,
  ingredientFoodDataParamsSchema,
  ingredientNutrientQuerySchema,
  previewFoodDataImportRequestSchema,
  replaceFoodDataRecordRequestSchema,
} from './food-data.schemas.js';

const adminSecurity = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];

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

function adminErrors(errorSchema: ZodType) {
  return {
    400: errorResponse(errorSchema, 'Food data không hợp lệ', [
      'VALIDATION_ERROR',
      'FOOD_DATA_SOURCE_UNAVAILABLE',
      'FOOD_DATA_REFERENCE_INVALID',
      'DUPLICATE_SOURCE_RECORD',
      'UNKNOWN_NUTRIENT_CODE',
      'NUTRIENT_UNIT_MISMATCH',
    ]),
    401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', ['AUTH_REQUIRED']),
    403: errorResponse(errorSchema, 'Chỉ Admin được quản lý food data', ['FORBIDDEN']),
    404: errorResponse(errorSchema, 'Không tìm thấy food-data record', ['FOOD_DATA_NOT_FOUND']),
    409: errorResponse(errorSchema, 'Xung đột version hoặc idempotency', [
      'FOOD_DATA_DUPLICATE',
      'FOOD_DATA_VERSION_CONFLICT',
      'IMPORT_IDEMPOTENCY_CONFLICT',
      'IMPORT_NOT_COMMITTABLE',
      'IMPORT_STAGING_INVALID',
      'IMPORT_REFERENCE_CHANGED',
    ]),
  };
}

export function registerFoodDataOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const listResponse = registry.register('FoodDataListResponse', foodDataListResponseSchema);
  const recordResponse = registry.register('FoodDataRecordResponse', foodDataRecordResponseSchema);
  const importResponse = registry.register('FoodDataImportResponse', foodDataImportResponseSchema);

  registry.registerPath({
    method: 'get',
    path: '/api/v1/food-data/ingredients/{ingredientId}/nutrients',
    tags: ['Food Data'],
    summary: 'Lấy nutrient values theo 100 g và provenance của ingredient',
    description:
      'Chỉ trả version APPROVED đang hiệu lực. Nutrient không có row là missing, không phải zero.',
    operationId: 'getIngredientNutrients',
    request: { params: ingredientFoodDataParamsSchema, query: ingredientNutrientQuerySchema },
    responses: {
      200: {
        description: 'Ingredient profile, conversions, nutrients và source metadata',
        content: { 'application/json': { schema: recordResponse } },
      },
      400: errorResponse(errorSchema, 'Query không hợp lệ', ['VALIDATION_ERROR']),
      404: errorResponse(errorSchema, 'Không tìm thấy ingredient', ['FOOD_DATA_NOT_FOUND']),
    },
  });

  const publicLists = [
    [
      '/api/v1/food-data/reference-intakes',
      'listNutrientReferenceIntakes',
      'Reference intakes và upper limits theo population',
    ],
    [
      '/api/v1/food-data/ingredient-guidelines',
      'listIngredientGuidelines',
      'Ingredient amount/frequency guidelines',
    ],
    [
      '/api/v1/food-data/cooking-methods',
      'listCookingMethods',
      'Cooking methods cùng retention/yield factors',
    ],
    [
      '/api/v1/food-data/interaction-rules',
      'listIngredientInteractionRules',
      'Interaction rules theo dish/meal/day',
    ],
  ] as const;
  for (const [path, operationId, summary] of publicLists) {
    registry.registerPath({
      method: 'get',
      path,
      tags: ['Food Data'],
      summary,
      description:
        'Public read chỉ trả dữ liệu APPROVED đang hiệu lực cùng provenance và review metadata.',
      operationId,
      request: { query: foodDataReadQuerySchema },
      responses: {
        200: {
          description: 'Danh sách có pagination',
          content: { 'application/json': { schema: listResponse } },
        },
        400: errorResponse(errorSchema, 'Query không hợp lệ', ['VALIDATION_ERROR']),
      },
    });
  }

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/food-data/records',
    tags: ['Food Data Admin'],
    summary: 'List food-data record theo kind, gồm cả staged/superseded',
    operationId: 'listAdminFoodDataRecords',
    security: adminSecurity,
    request: { query: adminFoodDataRecordQuerySchema },
    responses: {
      200: {
        description: 'Danh sách quản trị có pagination',
        content: { 'application/json': { schema: listResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/food-data/records',
    tags: ['Food Data Admin'],
    summary: 'Tạo source, nutrient, profile, factor, rule hoặc AI suggestion',
    description:
      'AI_SUGGESTION luôn được lưu STAGED. Hard interaction rule cần APPROVED và evidence được hỗ trợ.',
    operationId: 'createAdminFoodDataRecord',
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: createFoodDataRecordRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Record đã tạo',
        content: { 'application/json': { schema: recordResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'put',
    path: '/api/v1/admin/food-data/records/{id}',
    tags: ['Food Data Admin'],
    summary: 'Thay thế đầy đủ một food-data record',
    operationId: 'replaceAdminFoodDataRecord',
    security: adminSecurity,
    request: {
      params: foodDataIdParamsSchema,
      body: {
        required: true,
        content: { 'application/json': { schema: replaceFoodDataRecordRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Record đã cập nhật',
        content: { 'application/json': { schema: recordResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/admin/food-data/records/{id}',
    tags: ['Food Data Admin'],
    summary: 'Archive/supersede food-data record',
    description:
      'Không hard-delete dữ liệu đã review. Source/nutrient/method được deactivate; versioned record được SUPERSEDED.',
    operationId: 'archiveAdminFoodDataRecord',
    security: adminSecurity,
    request: { params: foodDataIdParamsSchema, query: foodDataRecordKindQuerySchema },
    responses: {
      200: {
        description: 'Record đã archive/supersede',
        content: { 'application/json': { schema: recordResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/food-data/imports/preview',
    tags: ['Food Data Admin'],
    summary: 'Validate và stage import qua provider adapter',
    description:
      'Không thay đổi canonical data. Kiểm tra aliases, units, ranges, source identity, version conflict và idempotency.',
    operationId: 'previewFoodDataImport',
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: previewFoodDataImportRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Import preview đã stage',
        content: { 'application/json': { schema: importResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/food-data/imports',
    tags: ['Food Data Admin'],
    summary: 'Commit import preview idempotently',
    operationId: 'commitFoodDataImport',
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: commitFoodDataImportRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Import đã commit hoặc replay idempotent',
        content: { 'application/json': { schema: importResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
}
