import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import type {
  AdjustmentListQuery,
  CreateAdjustmentInput,
  CreatePantryItemInput,
  ExpiringSoonQuery,
  MergePantryItemsInput,
  MergePreviewInput,
  PantryListQuery,
  UpdatePantryItemInput,
} from './pantry.schemas.js';
import type { PantryService } from './pantry.service.js';

function ownerId(request: Request): string {
  if (request.auth) return request.auth.userId;
  throw new AppError({
    statusCode: 401,
    code: 'AUTH_REQUIRED',
    message: 'Authentication required',
  });
}

export class PantryController {
  constructor(private readonly service: PantryService) {}

  list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(
      ownerId(request),
      getValidatedQuery<PantryListQuery>(request),
    );
    response.json({ success: true, ...result });
  };

  expiringSoon = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.expiringSoon(
      ownerId(request),
      getValidatedQuery<ExpiringSoonQuery>(request),
    );
    response.json({ success: true, ...result });
  };

  get = async (request: Request, response: Response): Promise<void> => {
    const item = await this.service.get(
      ownerId(request),
      getValidatedParams<{ id: string }>(request).id,
    );
    response.json({ success: true, data: item });
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.create(
      ownerId(request),
      getValidatedBody<CreatePantryItemInput>(request),
    );
    response.status(201).json({ success: true, data: result });
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const item = await this.service.update(
      ownerId(request),
      getValidatedParams<{ id: string }>(request).id,
      getValidatedBody<UpdatePantryItemInput>(request),
    );
    response.json({ success: true, data: item });
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    await this.service.delete(
      ownerId(request),
      getValidatedParams<{ id: string }>(request).id,
      getValidatedQuery<{ expectedVersion: number }>(request).expectedVersion,
    );
    response.status(204).end();
  };

  adjust = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.adjust(
      ownerId(request),
      getValidatedParams<{ id: string }>(request).id,
      getValidatedBody<CreateAdjustmentInput>(request),
    );
    response.json({ success: true, data: result });
  };

  listAdjustments = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listAdjustments(
      ownerId(request),
      getValidatedParams<{ id: string }>(request).id,
      getValidatedQuery<AdjustmentListQuery>(request),
    );
    response.json({ success: true, ...result });
  };

  mergePreview = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.mergePreview(
      ownerId(request),
      getValidatedBody<MergePreviewInput>(request),
    );
    response.json({ success: true, data: result });
  };

  merge = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.merge(
      ownerId(request),
      getValidatedBody<MergePantryItemsInput>(request),
    );
    response.json({ success: true, data: result });
  };
}
