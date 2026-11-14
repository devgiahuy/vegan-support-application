import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { z } from '../../common/validation/zod.js';
import {
  addReceiptImagesSchema,
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
  const addImagesRequest = registry.register('AddReceiptImagesRequest', addReceiptImagesSchema);
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
    description: 'Attaches owned committed RECEIPT_IMAGE assets. The configured OpenAI adapter reads JPEG/PNG/WebP receipt images; fake remains a development fixture and also accepts AVIF. Each image may expose a printed receipt number and merchant/date/currency/total metadata. Food and ready-to-eat items remain editable candidates; clearly non-food goods are excluded from candidates and listed in excludedItems with a notice and reason. Nothing modifies pantry before confirmation.',
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
    description: 'Returns notices and excludedItems for AI-classified non-food goods. Items classified UNCERTAIN remain candidates for user review. excludedItems carry candidate IDs and versions so the owner can restore a mistaken exclusion using PATCH with decision=KEEP.',
    operationId: 'getReceiptJob',
    security,
    request: { params: receiptJobParamsSchema },
    responses: { 200: { description: 'Owner-scoped receipt job', content: json(jobResponse) }, ...errors(errorSchema, [401, 404]) },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/receipt-jobs/{id}/images',
    tags: ['Receipts'],
    summary: 'Add more images to an unconfirmed receipt job and merge the new lines',
    description: 'Allowed while the job is READY, PARTIAL_FAILED or FAILED. Only the new images are analysed; candidates already read or edited are kept. Lines collapse only when images identify the same receipt; distinct receipts accumulate even with identical products. Partial same-receipt photos set reviewRequired. Images already attached, or with identical content to an attached image, are ignored. The job returns to QUEUED and is polled like a new job; it does not consume another usage credit once the job has been charged. The total image count is capped by the receipt image limit.',
    operationId: 'addReceiptJobImages',
    security,
    request: { params: receiptJobParamsSchema, body: { content: json(addImagesRequest) } },
    responses: { 202: { description: 'Job queued with the new images (or unchanged when nothing new was added)', content: json(jobResponse) }, ...errors(errorSchema, [401, 404, 409, 422, 503]) },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/receipt-jobs/{id}/candidates/{candidateId}',
    tags: ['Receipts'],
    summary: 'Correct or reject a receipt candidate',
    description: 'Can restore a mistakenly excluded non-food item by PATCHing its excludedItems ID and expectedVersion with decision=KEEP; the item then appears in candidates for confirmation. No pantry change occurs until confirmation.',
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
    description: 'The only receipt endpoint that mutates pantry; transactional and idempotent. AI-excluded non-food goods cannot be confirmed unless first restored with PATCH decision=KEEP. Confirmed overlap from another owned job is marked REJECTED with duplicateOfJobId and returned in duplicateCandidates instead of incrementing Pantry. When either photo lacks a number, merchant/date/currency/total and the full line multiset must match for automatic exact duplicate identification. Partial matches with a missing number set identityDecisionRequired and confirmation must include receiptReviewDecision=SAME_RECEIPT or SEPARATE_RECEIPTS; SAME_RECEIPT skips overlap, SEPARATE_RECEIPTS accumulates distinct purchases. Numbered partial photos are merged and still require candidate confirmation.',
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
    description: 'Uses reviewed conversions and current confirmed pantry quantities. Free-text pantry items count toward an ingredient only when their normalized text exactly matches its canonical name or an approved alias (no fuzzy matching). Items whose expiry date is before today (UTC) are not counted as available; each such adjustment is listed in conversionAssumptions. Receipt purchases are never counted separately from pantry.',
    operationId: 'previewShoppingGaps',
    security,
    request: { body: { content: json(shoppingRequest) } },
    responses: { 200: { description: 'Explainable required, available, missing, surplus, and unresolved items', content: json(shoppingResponse) }, ...errors(errorSchema, [401, 404, 422]) },
  });
}
