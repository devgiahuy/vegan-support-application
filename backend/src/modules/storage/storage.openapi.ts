import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  assetParamsSchema,
  commitReservationRequestSchema,
  createReservationRequestSchema,
  createReservationResponseSchema,
  createStorageAdjustmentRequestSchema,
  deleteAssetRequestSchema,
  reservationParamsSchema,
  reservationResponseSchema,
  storageAccountListQuerySchema,
  storageAccountListResponseSchema,
  storageAccountParamsSchema,
  storageAdjustmentListQuerySchema,
  storageAdjustmentListResponseSchema,
  storageAdjustmentResponseSchema,
  storageAssetResponseSchema,
  storagePolicyListQuerySchema,
  storagePolicyListResponseSchema,
  storagePolicyParamsSchema,
  storagePolicyResponseSchema,
  storageUsageResponseSchema,
  updateStoragePolicyRequestSchema,
} from './storage.schemas.js';

const authenticated = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];

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

const authErrors = (errorSchema: ZodType) => ({
  401: errorResponse(errorSchema, 'Yêu cầu đăng nhập hoặc access token không hợp lệ', [
    'AUTH_REQUIRED',
    'INVALID_ACCESS_TOKEN',
    'TOKEN_EXPIRED',
    'STALE_ACCESS_TOKEN',
  ]),
  403: errorResponse(errorSchema, 'Tài khoản không có quyền hoặc đã bị cấm', [
    'FORBIDDEN',
    'ACCOUNT_BANNED',
  ]),
});

export function registerStorageOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const usageResponse = registry.register('StorageUsageResponse', storageUsageResponseSchema);
  const createRequest = registry.register('CreateUploadReservationRequest', createReservationRequestSchema);
  const createResponse = registry.register('CreateUploadReservationResponse', createReservationResponseSchema);
  const commitRequest = registry.register('CommitUploadReservationRequest', commitReservationRequestSchema);
  const reservationResponse = registry.register('UploadReservationResponse', reservationResponseSchema);
  const deleteAssetRequest = registry.register('DeleteMediaAssetRequest', deleteAssetRequestSchema);
  const assetResponse = registry.register('StorageAssetResponse', storageAssetResponseSchema);
  const accountsResponse = registry.register('StorageAccountListResponse', storageAccountListResponseSchema);
  const policiesResponse = registry.register('StoragePolicyListResponse', storagePolicyListResponseSchema);
  const updatePolicyRequest = registry.register('UpdateStoragePolicyRequest', updateStoragePolicyRequestSchema);
  const policyResponse = registry.register('StoragePolicyResponse', storagePolicyResponseSchema);
  const adjustmentRequest = registry.register('CreateStorageAdjustmentRequest', createStorageAdjustmentRequestSchema);
  const adjustmentResponse = registry.register('StorageAdjustmentResponse', storageAdjustmentResponseSchema);
  const adjustmentsResponse = registry.register('StorageAdjustmentListResponse', storageAdjustmentListResponseSchema);

  registry.registerPath({
    method: 'get',
    path: '/api/v1/storage/me',
    tags: ['Storage'],
    summary: 'Đọc usage và quota của current user',
    operationId: 'getMyStorageUsage',
    security: authenticated,
    responses: {
      200: { description: 'Used, reserved, limit và remaining bytes', content: { 'application/json': { schema: usageResponse } } },
      ...authErrors(errorSchema),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/uploads/reservations',
    tags: ['Uploads'],
    summary: 'Reserve quota và cấp cấu hình signed upload',
    description: 'Atomically reserves declared bytes before Cloudinary upload. Reusing the same idempotencyKey and payload replays the reservation; a different payload conflicts.',
    operationId: 'createUploadReservation',
    security: authenticated,
    request: { body: { required: true, content: { 'application/json': { schema: createRequest } } } },
    responses: {
      201: { description: 'Reserved quota and signed Cloudinary upload configuration', content: { 'application/json': { schema: createResponse } } },
      400: errorResponse(errorSchema, 'Upload declaration không hợp lệ', ['VALIDATION_ERROR', 'INVALID_UPLOAD']),
      ...authErrors(errorSchema),
      409: errorResponse(errorSchema, 'Quota hoặc idempotency conflict', ['STORAGE_QUOTA_EXCEEDED', 'UPLOAD_IDEMPOTENCY_CONFLICT', 'UPLOAD_RESERVATION_CONFLICT']),
      410: errorResponse(errorSchema, 'Reservation retry đã hết hạn', ['UPLOAD_RESERVATION_EXPIRED']),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/uploads/reservations/{id}/commit',
    tags: ['Uploads'],
    summary: 'Verify provider và commit actual bytes',
    description: 'Validates Cloudinary response signature, fetches authoritative provider metadata, checks declared MIME/extension/per-file limit, then atomically moves reserved bytes to committed usage.',
    operationId: 'commitUploadReservation',
    security: authenticated,
    request: {
      params: reservationParamsSchema,
      body: { required: true, content: { 'application/json': { schema: commitRequest } } },
    },
    responses: {
      200: { description: 'Committed asset or idempotent replay', content: { 'application/json': { schema: reservationResponse } } },
      400: errorResponse(errorSchema, 'Commit payload không hợp lệ', ['VALIDATION_ERROR', 'INVALID_UPLOAD']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Reservation không thuộc current user', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Quota hoặc reservation conflict', ['STORAGE_QUOTA_EXCEEDED', 'UPLOAD_IDEMPOTENCY_CONFLICT', 'UPLOAD_RESERVATION_CONFLICT']),
      410: errorResponse(errorSchema, 'Reservation hết hạn', ['UPLOAD_RESERVATION_EXPIRED']),
      422: errorResponse(errorSchema, 'Provider metadata không khớp declaration', ['UPLOAD_PROVIDER_MISMATCH']),
      502: errorResponse(errorSchema, 'Không thể xác minh với provider', ['UPLOAD_PROVIDER_UNAVAILABLE']),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/uploads/reservations/{id}',
    tags: ['Uploads'],
    summary: 'Release reservation chưa commit',
    operationId: 'releaseUploadReservation',
    security: authenticated,
    request: { params: reservationParamsSchema },
    responses: {
      200: { description: 'Released, expired, or idempotent terminal reservation', content: { 'application/json': { schema: reservationResponse } } },
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Reservation không thuộc current user', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Committed reservation cannot be released', ['UPLOAD_RESERVATION_CONFLICT']),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/storage/assets/{id}',
    tags: ['Storage'],
    summary: 'Durably delete owned provider asset',
    description: 'Usage is decremented only after Cloudinary confirms ok or not found. Assets referenced by non-deleted content are blocked.',
    operationId: 'deleteStorageAsset',
    security: authenticated,
    request: {
      params: assetParamsSchema,
      body: { required: true, content: { 'application/json': { schema: deleteAssetRequest } } },
    },
    responses: {
      200: { description: 'Provider deletion confirmed and usage decremented once', content: { 'application/json': { schema: assetResponse } } },
      400: errorResponse(errorSchema, 'Delete payload không hợp lệ', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Asset không thuộc current user', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Asset is in use or idempotency conflict', ['MEDIA_ASSET_IN_USE', 'MEDIA_DELETE_IDEMPOTENCY_CONFLICT']),
      502: errorResponse(errorSchema, 'Provider did not confirm deletion', ['MEDIA_DELETE_FAILED']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/storage/accounts',
    tags: ['Storage Admin'],
    summary: 'List account usage and effective limits',
    operationId: 'listStorageAccounts',
    security: authenticated,
    request: { query: storageAccountListQuerySchema },
    responses: {
      200: { description: 'Paginated storage accounts', content: { 'application/json': { schema: accountsResponse } } },
      400: errorResponse(errorSchema, 'Query không hợp lệ', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/storage/policies',
    tags: ['Storage Admin'],
    summary: 'List configurable storage policies',
    operationId: 'listStoragePolicies',
    security: authenticated,
    request: { query: storagePolicyListQuerySchema },
    responses: {
      200: { description: 'Paginated policies', content: { 'application/json': { schema: policiesResponse } } },
      400: errorResponse(errorSchema, 'Query không hợp lệ', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/storage/policies/{id}',
    tags: ['Storage Admin'],
    summary: 'Update policy with optimistic version',
    operationId: 'updateStoragePolicy',
    security: authenticated,
    request: {
      params: storagePolicyParamsSchema,
      body: { required: true, content: { 'application/json': { schema: updatePolicyRequest } } },
    },
    responses: {
      200: { description: 'Updated policy', content: { 'application/json': { schema: policyResponse } } },
      400: errorResponse(errorSchema, 'Policy payload không hợp lệ', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Policy not found', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Policy version/default conflict', ['STORAGE_POLICY_CONFLICT']),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/storage/accounts/{userId}/adjustments',
    tags: ['Storage Admin'],
    summary: 'Grant or remove audited account quota bytes',
    operationId: 'createStorageAdjustment',
    security: authenticated,
    request: {
      params: storageAccountParamsSchema,
      body: { required: true, content: { 'application/json': { schema: adjustmentRequest } } },
    },
    responses: {
      201: { description: 'Audited idempotent adjustment', content: { 'application/json': { schema: adjustmentResponse } } },
      400: errorResponse(errorSchema, 'Adjustment payload không hợp lệ', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      409: errorResponse(errorSchema, 'Adjustment invalid or idempotency conflict', ['STORAGE_ADJUSTMENT_INVALID', 'STORAGE_ADJUSTMENT_IDEMPOTENCY_CONFLICT']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/storage/adjustments',
    tags: ['Storage Admin'],
    summary: 'List immutable Admin quota adjustments',
    operationId: 'listStorageAdjustments',
    security: authenticated,
    request: { query: storageAdjustmentListQuerySchema },
    responses: {
      200: { description: 'Paginated adjustment audit', content: { 'application/json': { schema: adjustmentsResponse } } },
      400: errorResponse(errorSchema, 'Query không hợp lệ', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
    },
  });
}
