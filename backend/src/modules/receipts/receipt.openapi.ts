import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { z } from '../../common/validation/zod.js';
import {
  confirmReceiptJobSchema,
  createReceiptJobSchema,
  receiptCandidateParamsSchema,
  receiptConfirmationEnvelopeSchema,
  receiptJobEnvelopeSchema,
  receiptJobParamsSchema,
  retryReceiptJobSchema,
  shoppingGapEnvelopeSchema,
  shoppingGapPreviewSchema,
  updateReceiptCandidateSchema,
} from './receipt.schemas.js';

const security = [{ bearerAuth: [] }, { cookieAuth: [] }];
const json = (schema: z.ZodTypeAny) => ({ 'application/json': { schema } });
const errors = (schema: z.ZodTypeAny, statuses: number[]) =>
  Object.fromEntries(statuses.map((status) => [status, { description: 'Business or validation error', content: json(schema) }]));

export function registerReceiptOpenApi(registry: OpenAPIRegistry, errorSchema: z.ZodTypeAny): void {
  const createRequest = registry.register('CreateReceiptJobRequest', createReceiptJobSchema);
  const updateRequest = registry.register('UpdateReceiptCandidateRequest', updateReceiptCandidateSchema);
  const confirmRequest = registry.register('ConfirmReceiptJobRequest', confirmReceiptJobSchema);
  const retryRequest = registry.register('RetryReceiptJobRequest', retryReceiptJobSchema);
  const shoppingRequest = registry.register('ShoppingGapPreviewRequest', shoppingGapPreviewSchema);
  const jobResponse = registry.register('ReceiptJobResponse', receiptJobEnvelopeSchema);
  const confirmationResponse = registry.register('ReceiptConfirmationResponse', receiptConfirmationEnvelopeSchema);
  const shoppingResponse = registry.register('ShoppingGapPreviewResponse', shoppingGapEnvelopeSchema);

  registry.registerPath({
    method: 'post',
    path: '/api/v1/receipt-jobs',
    tags: ['Receipts'],
    summary: 'Create an asynchronous receipt extraction job',
    description: 'Attaches owned committed RECEIPT_IMAGE assets. Extraction results never modify pantry.',
    operationId: 'createReceiptJob',
    security,
    request: { body: { content: json(createRequest) } },
    responses: { 202: { description: 'Job queued', content: json(jobResponse) }, ...errors(errorSchema, [401, 409, 422, 503]) },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/receipt-jobs/{id}',
    tags: ['Receipts'],
    summary: 'Get receipt metadata, progress, and editable candidate lines',
    operationId: 'getReceiptJob',
    security,
    request: { params: receiptJobParamsSchema },
    responses: { 200: { description: 'Owner-scoped receipt job', content: json(jobResponse) }, ...errors(errorSchema, [401, 404]) },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/receipt-jobs/{id}/candidates/{candidateId}',
    tags: ['Receipts'],
    summary: 'Correct or reject a receipt candidate',
    operationId: 'updateReceiptCandidate',
    security,
    request: { params: receiptCandidateParamsSchema, body: { content: json(updateRequest) } },
    responses: { 200: { description: 'Updated receipt job', content: json(jobResponse) }, ...errors(errorSchema, [401, 404, 409, 422]) },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/receipt-jobs/{id}/confirm',
    tags: ['Receipts'],
    summary: 'Confirm selected receipt candidates and apply the pantry diff',
    description: 'The only receipt endpoint that mutates pantry; transactional and idempotent.',
    operationId: 'confirmReceiptJob',
    security,
    request: { params: receiptJobParamsSchema, body: { content: json(confirmRequest) } },
    responses: { 200: { description: 'Confirmed job and pantry changes', content: json(confirmationResponse) }, ...errors(errorSchema, [401, 404, 409, 422]) },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/receipt-jobs/{id}/cancel',
    tags: ['Receipts'],
    summary: 'Cancel an unconfirmed receipt job',
    operationId: 'cancelReceiptJob',
    security,
    request: { params: receiptJobParamsSchema },
    responses: { 200: { description: 'Cancelled job', content: json(jobResponse) }, ...errors(errorSchema, [401, 404, 409]) },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/receipt-jobs/{id}/retry',
    tags: ['Receipts'],
    summary: 'Retry failed or partially failed receipt extraction',
    operationId: 'retryReceiptJob',
    security,
    request: { params: receiptJobParamsSchema, body: { content: json(retryRequest) } },
    responses: { 202: { description: 'Retry queued', content: json(jobResponse) }, ...errors(errorSchema, [401, 404, 409, 503]) },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/shopping-lists/preview',
    tags: ['Shopping Lists'],
    summary: 'Preview pantry-aware shopping gaps for selected meals and servings',
    description: 'Uses reviewed conversions and current confirmed pantry quantities. Receipt purchases are never counted separately from pantry.',
    operationId: 'previewShoppingGaps',
    security,
    request: { body: { content: json(shoppingRequest) } },
    responses: { 200: { description: 'Explainable required, available, missing, surplus, and unresolved items', content: json(shoppingResponse) }, ...errors(errorSchema, [401, 404, 422]) },
  });
}
