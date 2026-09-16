import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  adminCategoryListResponseSchema,
  adminCategoryQuerySchema,
  adminIngredientQuerySchema,
  aliasParamsSchema,
  archiveCategoryQuerySchema,
  archiveResponseSchema,
  categoryResponseSchema,
  createCategoryRequestSchema,
  createIngredientAliasRequestSchema,
  createIngredientRequestSchema,
  idParamsSchema,
  ingredientListResponseSchema,
  ingredientResolutionResponseSchema,
  ingredientResponseSchema,
  publicCategoryQuerySchema,
  publicCategoryTreeResponseSchema,
  publicIngredientQuerySchema,
  resolveIngredientQuerySchema,
  updateCategoryRequestSchema,
  updateIngredientRequestSchema,
} from './catalog.schemas.js';

const adminSecurity = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];

function errorResponse(errorSchema: ZodType, description: string, code: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: errorSchema,
        example: {
          success: false,
          error: {
            code,
            message: description,
            requestId: '0781d468-5eb1-4bd0-9671-e4ca33b76462',
          },
        },
      },
    },
  };
}

function multipleErrorResponse(errorSchema: ZodType, description: string, codes: string[]) {
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
    400: multipleErrorResponse(errorSchema, 'Dữ liệu catalog không hợp lệ', [
      'VALIDATION_ERROR',
      'INVALID_CATALOG_NAME',
      'INVALID_CATEGORY_PARENT',
      'CATEGORY_TYPE_MISMATCH',
      'CATEGORY_DEPTH_EXCEEDED',
      'INVALID_CATEGORY_REPLACEMENT',
      'INVALID_INGREDIENT_METADATA',
    ]),
    401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', 'AUTH_REQUIRED'),
    403: errorResponse(errorSchema, 'Chỉ Admin được quản lý catalog', 'FORBIDDEN'),
    404: errorResponse(errorSchema, 'Không tìm thấy catalog item', 'NOT_FOUND'),
    409: multipleErrorResponse(errorSchema, 'Catalog item bị trùng hoặc đang được tham chiếu', [
      'CATEGORY_SLUG_CONFLICT',
      'CATEGORY_REPLACEMENT_REQUIRED',
      'CATEGORY_REPLACEMENT_CONFLICT',
      'INGREDIENT_NAME_CONFLICT',
      'INGREDIENT_ALIAS_CONFLICT',
      'CATALOG_REFERENCE_CONFLICT',
    ]),
  };
}

export function registerCatalogOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const categoryTreeResponse = registry.register(
    'CategoryTreeResponse',
    publicCategoryTreeResponseSchema,
  );
  const categoryResponse = registry.register('CategoryResponse', categoryResponseSchema);
  const adminCategoryListResponse = registry.register(
    'AdminCategoryListResponse',
    adminCategoryListResponseSchema,
  );
  const ingredientResponse = registry.register('IngredientResponse', ingredientResponseSchema);
  const ingredientListResponse = registry.register(
    'IngredientListResponse',
    ingredientListResponseSchema,
  );
  const resolutionResponse = registry.register(
    'IngredientResolutionResponse',
    ingredientResolutionResponseSchema,
  );
  const archivedResponse = registry.register('CatalogArchiveResponse', archiveResponseSchema);

  registry.registerPath({
    method: 'get',
    path: '/api/v1/categories',
    tags: ['Categories'],
    summary: 'Lấy cây category active tối đa hai tầng',
    operationId: 'listPublicCategories',
    request: { query: publicCategoryQuerySchema },
    responses: {
      200: {
        description: 'Public category tree',
        content: { 'application/json': { schema: categoryTreeResponse } },
      },
      400: errorResponse(errorSchema, 'Query không hợp lệ', 'VALIDATION_ERROR'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/categories',
    tags: ['Catalog Admin'],
    summary: 'List category gồm cả archived',
    operationId: 'listAdminCategories',
    security: adminSecurity,
    request: { query: adminCategoryQuerySchema },
    responses: {
      200: {
        description: 'Danh sách category có pagination',
        content: { 'application/json': { schema: adminCategoryListResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/categories',
    tags: ['Catalog Admin'],
    summary: 'Tạo category',
    description:
      'Parent và child phải cùng type; tree tối đa hai tầng; slug unique trong parent/type.',
    operationId: 'createCategory',
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: createCategoryRequestSchema,
            example: { name: 'Món chính', type: 'FOOD_TYPE', sortOrder: 10 },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Category đã tạo',
        content: { 'application/json': { schema: categoryResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/categories/{id}',
    tags: ['Catalog Admin'],
    summary: 'Cập nhật category',
    operationId: 'updateCategory',
    security: adminSecurity,
    request: {
      params: idParamsSchema,
      body: {
        required: true,
        content: { 'application/json': { schema: updateCategoryRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Category đã cập nhật',
        content: { 'application/json': { schema: categoryResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/admin/categories/{id}',
    tags: ['Catalog Admin'],
    summary: 'Archive category',
    description:
      'Category có child active, pending proposal hoặc content reference bắt buộc replacementId active, cùng type và cùng tầng. Reparent, thay content reference và archive chạy trong một transaction.',
    operationId: 'archiveCategory',
    security: adminSecurity,
    request: { params: idParamsSchema, query: archiveCategoryQuerySchema },
    responses: {
      200: {
        description: 'Category đã archive',
        content: { 'application/json': { schema: archivedResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/ingredients',
    tags: ['Ingredients'],
    summary: 'List canonical ingredient active',
    operationId: 'listPublicIngredients',
    request: { query: publicIngredientQuerySchema },
    responses: {
      200: {
        description: 'Ingredient list có metadata và pagination',
        content: { 'application/json': { schema: ingredientListResponse } },
      },
      400: errorResponse(errorSchema, 'Query không hợp lệ', 'VALIDATION_ERROR'),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/ingredients/resolve',
    tags: ['Ingredients'],
    summary: 'Resolve tên/alias ingredient không phân biệt dấu',
    description:
      'Trả NONE, EXACT hoặc AMBIGUOUS. Khi ambiguous, client phải cho người dùng chọn candidate; backend không tự chọn.',
    operationId: 'resolveIngredient',
    request: { query: resolveIngredientQuerySchema },
    responses: {
      200: {
        description: 'Kết quả resolution',
        content: { 'application/json': { schema: resolutionResponse } },
      },
      400: errorResponse(errorSchema, 'Query không hợp lệ', 'VALIDATION_ERROR'),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/ingredients',
    tags: ['Catalog Admin'],
    summary: 'List ingredient gồm cả archived',
    operationId: 'listAdminIngredients',
    security: adminSecurity,
    request: { query: adminIngredientQuerySchema },
    responses: {
      200: {
        description: 'Ingredient list có pagination',
        content: { 'application/json': { schema: ingredientListResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/ingredients',
    tags: ['Catalog Admin'],
    summary: 'Tạo canonical ingredient và metadata',
    operationId: 'createIngredient',
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: createIngredientRequestSchema,
            example: {
              canonicalName: 'Đậu hũ',
              foodGroup: 'LEGUMES',
              allergenCodes: ['SOY'],
              dietCompatibilities: [{ dietPattern: 'VEGAN', compatible: true }],
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Ingredient đã tạo',
        content: { 'application/json': { schema: ingredientResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/ingredients/{id}',
    tags: ['Catalog Admin'],
    summary: 'Cập nhật ingredient hoặc full snapshot metadata',
    operationId: 'updateIngredient',
    security: adminSecurity,
    request: {
      params: idParamsSchema,
      body: {
        required: true,
        content: { 'application/json': { schema: updateIngredientRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Ingredient đã cập nhật',
        content: { 'application/json': { schema: ingredientResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/admin/ingredients/{id}',
    tags: ['Catalog Admin'],
    summary: 'Archive ingredient',
    operationId: 'archiveIngredient',
    security: adminSecurity,
    request: { params: idParamsSchema },
    responses: {
      200: {
        description: 'Ingredient đã archive',
        content: { 'application/json': { schema: archivedResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/ingredients/{id}/aliases',
    tags: ['Catalog Admin'],
    summary: 'Thêm alias ingredient',
    description:
      'Alias được normalize không dấu. Cùng alias có thể trỏ tới nhiều canonical ingredient để biểu diễn kết quả ambiguous.',
    operationId: 'addIngredientAlias',
    security: adminSecurity,
    request: {
      params: idParamsSchema,
      body: {
        required: true,
        content: {
          'application/json': {
            schema: createIngredientAliasRequestSchema,
            example: { alias: 'tofu' },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Alias đã thêm',
        content: { 'application/json': { schema: ingredientResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/admin/ingredients/{id}/aliases/{aliasId}',
    tags: ['Catalog Admin'],
    summary: 'Xóa alias của ingredient',
    operationId: 'deleteIngredientAlias',
    security: adminSecurity,
    request: { params: aliasParamsSchema },
    responses: { 204: { description: 'Alias đã xóa' }, ...adminErrors(errorSchema) },
  });
}
