import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../../common/validation/zod.js';
import {
  adjustmentListQuerySchema,
  createAdjustmentSchema,
  createPantryItemSchema,
  deletePantryItemQuerySchema,
  expiringSoonQuerySchema,
  mergePantryItemsSchema,
  mergePreviewEnvelopeSchema,
  mergePreviewSchema,
  pantryAdjustmentEnvelopeSchema,
  pantryAdjustmentListEnvelopeSchema,
  pantryItemEnvelopeSchema,
  pantryItemIdParamsSchema,
  pantryItemResponseSchema,
  pantryListEnvelopeSchema,
  pantryListQuerySchema,
  updatePantryItemSchema,
} from './pantry.schemas.js';

const tag = 'Pantry';
const security = [{ bearerAuth: [] }];
const json = (schema: z.ZodTypeAny) => ({ 'application/json': { schema } });
const errors = (errorResponse: z.ZodTypeAny, statuses: number[]) =>
  Object.fromEntries(
    statuses.map((status) => [
      status,
      { description: 'Business or validation error', content: json(errorResponse) },
    ]),
  );

export function registerPantryOpenApi(
  registry: OpenAPIRegistry,
  errorResponse: z.ZodTypeAny,
): void {
  const item = registry.register('PantryItemResponse', pantryItemResponseSchema);
  const itemEnvelope = registry.register('PantryItemEnvelope', pantryItemEnvelopeSchema);
  const listEnvelope = registry.register('PantryListEnvelope', pantryListEnvelopeSchema);
  const adjustmentEnvelope = registry.register(
    'PantryAdjustmentEnvelope',
    pantryAdjustmentEnvelopeSchema,
  );
  const adjustmentListEnvelope = registry.register(
    'PantryAdjustmentListEnvelope',
    pantryAdjustmentListEnvelopeSchema,
  );
  const previewEnvelope = registry.register(
    'PantryMergePreviewEnvelope',
    mergePreviewEnvelopeSchema,
  );

  registry.registerPath({
    method: 'get',
    path: '/api/v1/pantry/items',
    tags: [tag],
    summary: 'List and filter owned pantry items',
    operationId: 'listPantryItems',
    security,
    request: { query: pantryListQuerySchema },
    responses: {
      200: { description: 'Paginated pantry inventory', content: json(listEnvelope) },
      ...errors(errorResponse, [400, 401]),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/pantry/items',
    tags: [tag],
    summary: 'Create a confirmed manual pantry item',
    operationId: 'createPantryItem',
    security,
    request: { body: { content: json(createPantryItemSchema) } },
    responses: {
      201: {
        description: 'Created item and initial ledger entry',
        content: json(adjustmentEnvelope),
      },
      ...errors(errorResponse, [400, 401, 409, 422]),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/pantry/items/expiring-soon',
    tags: [tag],
    summary: 'List confirmed items expiring in an inclusive date window',
    description: 'Expiry is a user-provided observation and is not a food-safety determination.',
    operationId: 'listExpiringPantryItems',
    security,
    request: { query: expiringSoonQuerySchema },
    responses: {
      200: { description: 'Expiring pantry items', content: json(listEnvelope) },
      ...errors(errorResponse, [400, 401]),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/pantry/merge-preview',
    tags: [tag],
    summary: 'Preview duplicate pantry item merge',
    operationId: 'previewPantryMerge',
    security,
    request: { body: { content: json(mergePreviewSchema) } },
    responses: {
      200: {
        description: 'Merge compatibility and projected balance',
        content: json(previewEnvelope),
      },
      ...errors(errorResponse, [400, 401, 404]),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/pantry/merge',
    tags: [tag],
    summary: 'Merge duplicate pantry items atomically',
    operationId: 'mergePantryItems',
    security,
    request: { body: { content: json(mergePantryItemsSchema) } },
    responses: {
      200: {
        description: 'Surviving pantry item',
        content: json(z.object({ success: z.literal(true), data: item })),
      },
      ...errors(errorResponse, [400, 401, 404, 409, 422]),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/pantry/items/{id}',
    tags: [tag],
    summary: 'Get an owned pantry item',
    operationId: 'getPantryItem',
    security,
    request: { params: pantryItemIdParamsSchema },
    responses: {
      200: { description: 'Pantry item', content: json(itemEnvelope) },
      ...errors(errorResponse, [401, 404]),
    },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/pantry/items/{id}',
    tags: [tag],
    summary: 'Update pantry observations with optimistic concurrency',
    operationId: 'updatePantryItem',
    security,
    request: { params: pantryItemIdParamsSchema, body: { content: json(updatePantryItemSchema) } },
    responses: {
      200: { description: 'Updated pantry item', content: json(itemEnvelope) },
      ...errors(errorResponse, [400, 401, 404, 409, 422]),
    },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/pantry/items/{id}',
    tags: [tag],
    summary: 'Soft-delete an owned pantry item',
    operationId: 'deletePantryItem',
    security,
    request: { params: pantryItemIdParamsSchema, query: deletePantryItemQuerySchema },
    responses: {
      204: { description: 'Soft-deleted; history retained' },
      ...errors(errorResponse, [400, 401, 404, 409]),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/pantry/items/{id}/adjustments',
    tags: [tag],
    summary: 'List immutable quantity ledger entries',
    operationId: 'listPantryAdjustments',
    security,
    request: { params: pantryItemIdParamsSchema, query: adjustmentListQuerySchema },
    responses: {
      200: { description: 'Paginated adjustment history', content: json(adjustmentListEnvelope) },
      ...errors(errorResponse, [400, 401, 404]),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/pantry/items/{id}/adjustments',
    tags: [tag],
    summary: 'Consume, restore, or adjust pantry quantity',
    operationId: 'adjustPantryItem',
    security,
    request: { params: pantryItemIdParamsSchema, body: { content: json(createAdjustmentSchema) } },
    responses: {
      200: {
        description: 'Updated item and immutable ledger entry',
        content: json(adjustmentEnvelope),
      },
      ...errors(errorResponse, [400, 401, 404, 409, 422]),
    },
  });
}
