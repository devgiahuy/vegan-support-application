import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { z } from '../../common/validation/zod.js';
import {
  confirmRecognitionJobSchema,
  createRecognitionJobSchema,
  recognitionConfirmationEnvelopeSchema,
  recognitionCandidateParamsSchema,
  recognitionJobParamsSchema,
  recognitionJobEnvelopeSchema,
  retryRecognitionJobSchema,
  updateRecognitionCandidateSchema,
} from './ingredient-recognition.schemas.js';

const security = [{ bearerAuth: [] }, { cookieAuth: [] }];
export function registerIngredientRecognitionOpenApi(
  registry: OpenAPIRegistry,
  errorSchema: z.ZodTypeAny,
): void {
  const createRequest = registry.register('CreateRecognitionJobRequest', createRecognitionJobSchema);
  const updateRequest = registry.register(
    'UpdateRecognitionCandidateRequest',
    updateRecognitionCandidateSchema,
  );
  const confirmRequest = registry.register(
    'ConfirmRecognitionJobRequest',
    confirmRecognitionJobSchema,
  );
  const retryRequest = registry.register('RetryRecognitionJobRequest', retryRecognitionJobSchema);
  const jobResponse = registry.register('RecognitionJobResponse', recognitionJobEnvelopeSchema);
  const confirmationResponse = registry.register(
    'RecognitionConfirmationResponse',
    recognitionConfirmationEnvelopeSchema,
  );
  const errors = (codes: number[]) =>
    Object.fromEntries(
      codes.map((code) => [
        code,
        {
          description: 'Request could not be completed',
          content: { 'application/json': { schema: errorSchema } },
        },
      ]),
    );

  registry.registerPath({
    method: 'post',
    path: '/api/v1/ingredient-recognition/jobs',
    tags: ['Ingredient Recognition'],
    summary: 'Create an asynchronous multi-image fridge recognition job',
    description:
      'Attach owned, committed FRIDGE_IMAGE assets. Recognition candidates never modify pantry until the confirm endpoint is called.',
    operationId: 'createIngredientRecognitionJob',
    security,
    request: { body: { content: { 'application/json': { schema: createRequest } } } },
    responses: {
      202: { description: 'Job queued', content: { 'application/json': { schema: jobResponse } } },
      ...errors([401, 409, 422, 503]),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/ingredient-recognition/jobs/{id}',
    tags: ['Ingredient Recognition'],
    summary: 'Get recognition progress and editable candidates',
    operationId: 'getIngredientRecognitionJob',
    security,
    request: { params: recognitionJobParamsSchema },
    responses: {
      200: { description: 'Owner-scoped job detail', content: { 'application/json': { schema: jobResponse } } },
      ...errors([401, 404]),
    },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/ingredient-recognition/jobs/{id}/candidates/{candidateId}',
    tags: ['Ingredient Recognition'],
    summary: 'Correct or reject a recognition candidate',
    operationId: 'updateIngredientRecognitionCandidate',
    security,
    request: {
      params: recognitionCandidateParamsSchema,
      body: { content: { 'application/json': { schema: updateRequest } } },
    },
    responses: {
      200: { description: 'Updated job detail', content: { 'application/json': { schema: jobResponse } } },
      ...errors([401, 404, 409, 422]),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/ingredient-recognition/jobs/{id}/confirm',
    tags: ['Ingredient Recognition'],
    summary: 'Confirm selected candidates and apply the pantry diff',
    description:
      'This is the only recognition boundary that creates or updates pantry inventory. The transaction is idempotent.',
    operationId: 'confirmIngredientRecognitionJob',
    security,
    request: {
      params: recognitionJobParamsSchema,
      body: { content: { 'application/json': { schema: confirmRequest } } },
    },
    responses: {
      200: {
        description: 'Confirmed job and explicit pantry changes',
        content: { 'application/json': { schema: confirmationResponse } },
      },
      ...errors([401, 404, 409, 422]),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/ingredient-recognition/jobs/{id}/cancel',
    tags: ['Ingredient Recognition'],
    summary: 'Cancel an unconfirmed recognition job',
    operationId: 'cancelIngredientRecognitionJob',
    security,
    request: { params: recognitionJobParamsSchema },
    responses: {
      200: { description: 'Cancelled job detail', content: { 'application/json': { schema: jobResponse } } },
      ...errors([401, 404, 409]),
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/ingredient-recognition/jobs/{id}/retry',
    tags: ['Ingredient Recognition'],
    summary: 'Retry a failed or partially failed recognition job',
    operationId: 'retryIngredientRecognitionJob',
    security,
    request: {
      params: recognitionJobParamsSchema,
      body: { content: { 'application/json': { schema: retryRequest } } },
    },
    responses: {
      202: { description: 'Retry queued', content: { 'application/json': { schema: jobResponse } } },
      ...errors([401, 404, 409, 503]),
    },
  });
}
