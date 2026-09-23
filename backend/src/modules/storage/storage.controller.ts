import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import type { StorageService } from './storage.service.js';
import {
  createReservationResponseSchema,
  reservationResponseSchema,
  storageAccountListResponseSchema,
  storageAdjustmentListResponseSchema,
  storageAdjustmentResponseSchema,
  storageAssetResponseSchema,
  storagePolicyListResponseSchema,
  storagePolicyResponseSchema,
  storageUsageResponseSchema,
  type CommitReservationInput,
  type CreateReservationInput,
  type CreateStorageAdjustmentInput,
  type DeleteAssetInput,
  type StorageAccountListQuery,
  type StorageAdjustmentListQuery,
  type StoragePolicyListQuery,
  type UpdateStoragePolicyInput,
} from './storage.schemas.js';

function userId(request: Request): string {
  if (request.auth) return request.auth.userId;
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
}

export class StorageController {
  constructor(private readonly service: StorageService) {}

  getMyUsage = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.getUsage(userId(request));
    response.status(200).json(storageUsageResponseSchema.parse({ success: true, data, meta: null }));
  };

  createReservation = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.createReservation(
      userId(request),
      getValidatedBody<CreateReservationInput>(request),
    );
    response
      .status(201)
      .json(createReservationResponseSchema.parse({ success: true, data, meta: null }));
  };

  commitReservation = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<{ id: string }>(request);
    const data = await this.service.commitReservation(
      userId(request),
      id,
      getValidatedBody<CommitReservationInput>(request),
    );
    response.status(200).json(reservationResponseSchema.parse({ success: true, data, meta: null }));
  };

  releaseReservation = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<{ id: string }>(request);
    const data = await this.service.releaseReservation(userId(request), id);
    response.status(200).json(reservationResponseSchema.parse({ success: true, data, meta: null }));
  };

  deleteAsset = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<{ id: string }>(request);
    const input = getValidatedBody<DeleteAssetInput>(request);
    const data = await this.service.deleteAsset(userId(request), id, input.idempotencyKey);
    response.status(200).json(storageAssetResponseSchema.parse({ success: true, data, meta: null }));
  };

  listAccounts = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listAccounts(getValidatedQuery<StorageAccountListQuery>(request));
    response
      .status(200)
      .json(storageAccountListResponseSchema.parse({ success: true, data: result.data, meta: result.meta }));
  };

  listPolicies = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listPolicies(getValidatedQuery<StoragePolicyListQuery>(request));
    response
      .status(200)
      .json(storagePolicyListResponseSchema.parse({ success: true, data: result.data, meta: result.meta }));
  };

  updatePolicy = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<{ id: string }>(request);
    const data = await this.service.updatePolicy(
      id,
      userId(request),
      getValidatedBody<UpdateStoragePolicyInput>(request),
    );
    response.status(200).json(storagePolicyResponseSchema.parse({ success: true, data, meta: null }));
  };

  adjustAccount = async (request: Request, response: Response): Promise<void> => {
    const { userId: subjectId } = getValidatedParams<{ userId: string }>(request);
    const data = await this.service.adjustAccount(
      subjectId,
      userId(request),
      getValidatedBody<CreateStorageAdjustmentInput>(request),
    );
    response
      .status(201)
      .json(storageAdjustmentResponseSchema.parse({ success: true, data, meta: null }));
  };

  listAdjustments = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listAdjustments(
      getValidatedQuery<StorageAdjustmentListQuery>(request),
    );
    response
      .status(200)
      .json(storageAdjustmentListResponseSchema.parse({ success: true, data: result.data, meta: result.meta }));
  };
}
