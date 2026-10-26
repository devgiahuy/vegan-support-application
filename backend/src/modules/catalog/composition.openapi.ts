import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import { idParamsSchema } from './catalog.schemas.js';
import {
  allergenCatalogResponseSchema,
  compositionInputSchema,
  compositionResponseSchema,
  compositionSourcesResponseSchema,
} from './composition.schemas.js';

export function registerCompositionOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType) {
  const response = registry.register('IngredientCompositionResponse', compositionResponseSchema);
  const allergenResponse = registry.register(
    'AllergenCatalogResponse',
    allergenCatalogResponseSchema,
  );
  const sources = registry.register('CompositionSourcesResponse', compositionSourcesResponseSchema);
  const security = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];
  const errors = {
    400: {
      description:
        'VALIDATION_ERROR, INVALID_INGREDIENT_COMPONENT, INGREDIENT_COMPOSITION_CYCLE, INGREDIENT_COMPOSITION_DEPTH, INVALID_COMPOSITION_SOURCE',
      content: { 'application/json': { schema: errorSchema } },
    },
    401: { description: 'AUTH_REQUIRED', content: { 'application/json': { schema: errorSchema } } },
    403: {
      description: 'FORBIDDEN: ADMIN only',
      content: { 'application/json': { schema: errorSchema } },
    },
    404: { description: 'NOT_FOUND', content: { 'application/json': { schema: errorSchema } } },
    409: {
      description: 'INGREDIENT_COMPOSITION_CONFLICT: reload latest version',
      content: { 'application/json': { schema: errorSchema } },
    },
  };
  registry.registerPath({
    method: 'get',
    path: '/api/v1/allergens',
    tags: ['Allergens'],
    summary: 'Danh mục dị ứng theo tên và tên đồng nghĩa',
    operationId: 'listAllergens',
    description:
      'Active reviewed catalog labels and approved ingredient search terms. Search/typo suggestions never select a code automatically. Preferences accept only active catalog codes.',
    responses: {
      200: {
        description: 'Named catalog',
        content: { 'application/json': { schema: allergenResponse } },
      },
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/ingredient-composition-sources',
    tags: ['Catalog Admin'],
    summary: 'Nguồn dữ liệu dùng để rà soát thành phần',
    operationId: 'listCompositionSources',
    security,
    responses: {
      200: {
        description: 'Active sources and licenses',
        content: { 'application/json': { schema: sources } },
      },
      ...errors,
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/ingredients/{id}/composition',
    tags: ['Catalog Admin'],
    summary: 'Đọc thành phần, mức đầy đủ và lịch sử rà soát',
    operationId: 'getIngredientComposition',
    security,
    request: { params: idParamsSchema },
    responses: {
      200: {
        description: 'Current composition and latest 20 audit entries',
        content: { 'application/json': { schema: response } },
      },
      ...errors,
    },
  });
  registry.registerPath({
    method: 'put',
    path: '/api/v1/admin/ingredients/{id}/composition',
    tags: ['Catalog Admin'],
    summary: 'Admin rà soát cấu tạo nguyên liệu',
    operationId: 'saveIngredientComposition',
    security,
    description:
      'Replace canonical component edges and reviewed completeness. Source/version/record and exact product/formulation scope are required for PARTIAL/COMPLETE. Reviewer/time and license attribution are server-set; append-only audit. Serialized writes reject cycles and depth >32. COMPLETE parent is still uncertain if any descendant/source is incomplete/inactive. Does not certify allergy safety or alter nutrition.',
    request: {
      params: idParamsSchema,
      body: { content: { 'application/json': { schema: compositionInputSchema } } },
    },
    responses: {
      200: {
        description: 'Updated assessment',
        content: { 'application/json': { schema: response } },
      },
      ...errors,
    },
  });
}
