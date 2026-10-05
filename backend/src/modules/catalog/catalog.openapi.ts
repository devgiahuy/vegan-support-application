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
    400: multipleErrorResponse(errorSchema, 'D? li?u catalog kh�ng h?p l?', [
      'VALIDATION_ERROR',
      'INVALID_CATALOG_NAME',
      'INVALID_CATEGORY_PARENT',
      'CATEGORY_TYPE_MISMATCH',
      'CATEGORY_DEPTH_EXCEEDED',
      'INVALID_CATEGORY_REPLACEMENT',
      'INVALID_INGREDIENT_METADATA',
    ]),
    401: errorResponse(errorSchema, 'Y�u c?u dang nh?p', 'AUTH_REQUIRED'),
    403: errorResponse(errorSchema, 'Ch? Admin du?c qu?n l� catalog', 'FORBIDDEN'),
    404: errorResponse(errorSchema, 'Kh�ng t�m th?y catalog item', 'NOT_FOUND'),
    409: multipleErrorResponse(errorSchema, 'Catalog item b? tr�ng ho?c dang du?c tham chi?u', [
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
    summary: 'L?y c�y category active t?i da hai t?ng',
    operationId: 'listPublicCategories',
    request: { query: publicCategoryQuerySchema },
    responses: {
      200: {
        description: 'Public category tree',
        content: { 'application/json': { schema: categoryTreeResponse } },
      },
      400: errorResponse(errorSchema, 'Query kh�ng h?p l?', 'VALIDATION_ERROR'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/categories',
    tags: ['Catalog Admin'],
    summary: 'List category g?m c? archived',
    operationId: 'listAdminCategories',
    security: adminSecurity,
    request: { query: adminCategoryQuerySchema },
    responses: {
      200: {
        description: 'Danh s�ch category c� pagination',
        content: { 'application/json': { schema: adminCategoryListResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/categories',
    tags: ['Catalog Admin'],
    summary: 'T?o category',
    description:
      'Parent v� child ph?i c�ng type; tree t?i da hai t?ng; slug unique trong parent/type.',
    operationId: 'createCategory',
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: createCategoryRequestSchema,
            example: { name: 'M�n ch�nh', type: 'FOOD_TYPE', sortOrder: 10 },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Category d� t?o',
        content: { 'application/json': { schema: categoryResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/categories/{id}',
    tags: ['Catalog Admin'],
    summary: 'C?p nh?t category',
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
        description: 'Category d� c?p nh?t',
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
      'Category c� child active, pending proposal ho?c content reference b?t bu?c replacementId active, c�ng type v� c�ng t?ng. Reparent, thay content reference v� archive ch?y trong m?t transaction.',
    operationId: 'archiveCategory',
    security: adminSecurity,
    request: { params: idParamsSchema, query: archiveCategoryQuerySchema },
    responses: {
      200: {
        description: 'Category d� archive',
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
        description: 'Ingredient list c� metadata v� pagination',
        content: { 'application/json': { schema: ingredientListResponse } },
      },
      400: errorResponse(errorSchema, 'Query kh�ng h?p l?', 'VALIDATION_ERROR'),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/ingredients/resolve',
    tags: ['Ingredients'],
    summary: 'Resolve t�n/alias ingredient kh�ng ph�n bi?t d?u',
    description:
      'Tr? NONE, EXACT ho?c AMBIGUOUS. Khi ambiguous, client ph?i cho ngu?i d�ng ch?n candidate; backend kh�ng t? ch?n.',
    operationId: 'resolveIngredient',
    request: { query: resolveIngredientQuerySchema },
    responses: {
      200: {
        description: 'K?t qu? resolution',
        content: { 'application/json': { schema: resolutionResponse } },
      },
      400: errorResponse(errorSchema, 'Query kh�ng h?p l?', 'VALIDATION_ERROR'),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/ingredients',
    tags: ['Catalog Admin'],
    summary: 'List ingredient g?m c? archived',
    operationId: 'listAdminIngredients',
    security: adminSecurity,
    request: { query: adminIngredientQuerySchema },
    responses: {
      200: {
        description: 'Ingredient list c� pagination',
        content: { 'application/json': { schema: ingredientListResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/ingredients',
    tags: ['Catalog Admin'],
    summary: 'T?o canonical ingredient v� metadata',
    operationId: 'createIngredient',
    security: adminSecurity,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: createIngredientRequestSchema,
            example: {
              canonicalName: '�?u hu',
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
        description: 'Ingredient d� t?o',
        content: { 'application/json': { schema: ingredientResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/ingredients/{id}',
    tags: ['Catalog Admin'],
    summary: 'C?p nh?t ingredient ho?c full snapshot metadata',
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
        description: 'Ingredient d� c?p nh?t',
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
        description: 'Ingredient d� archive',
        content: { 'application/json': { schema: archivedResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/ingredients/{id}/aliases',
    tags: ['Catalog Admin'],
    summary: 'Th�m alias ingredient',
    description:
      'Alias du?c normalize kh�ng d?u. C�ng alias c� th? tr? t?i nhi?u canonical ingredient d? bi?u di?n k?t qu? ambiguous.',
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
        description: 'Alias d� th�m',
        content: { 'application/json': { schema: ingredientResponse } },
      },
      ...adminErrors(errorSchema),
    },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/admin/ingredients/{id}/aliases/{aliasId}',
    tags: ['Catalog Admin'],
    summary: 'X�a alias c?a ingredient',
    operationId: 'deleteIngredientAlias',
    security: adminSecurity,
    request: { params: aliasParamsSchema },
    responses: { 204: { description: 'Alias d� x�a' }, ...adminErrors(errorSchema) },
  });
}
