import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import type {
  AttachPhotoInput,
  CreateCustomMealInput,
  CustomMealListQuery,
  ReorderPhotosInput,
  UpdateCustomMealInput,
} from './custom-meal.schemas.js';
import type { CustomMealService } from './custom-meal.service.js';

function userId(request: Request): string {
  if (request.auth) return request.auth.userId;
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
}

interface IdParams {
  id: string;
}

interface PhotoParams {
  id: string;
  assetId: string;
}

export class CustomMealController {
  constructor(private readonly service: CustomMealService) {}

  list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(
      userId(request),
      getValidatedQuery<CustomMealListQuery>(request),
    );
    response.json({ success: true, data: result });
  };

  get = async (request: Request, response: Response): Promise<void> => {
    const meal = await this.service.get(
      userId(request),
      getValidatedParams<IdParams>(request).id,
    );
    response.json({ success: true, data: meal });
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const meal = await this.service.create(
      userId(request),
      getValidatedBody<CreateCustomMealInput>(request),
    );
    response.status(201).json({ success: true, data: meal });
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const meal = await this.service.update(
      userId(request),
      getValidatedParams<IdParams>(request).id,
      getValidatedBody<UpdateCustomMealInput>(request),
    );
    response.json({ success: true, data: meal });
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    await this.service.delete(
      userId(request),
      getValidatedParams<IdParams>(request).id,
    );
    response.status(204).end();
  };

  attachPhoto = async (request: Request, response: Response): Promise<void> => {
    const meal = await this.service.attachPhoto(
      userId(request),
      getValidatedParams<IdParams>(request).id,
      getValidatedBody<AttachPhotoInput>(request),
    );
    response.json({ success: true, data: meal });
  };

  removePhoto = async (request: Request, response: Response): Promise<void> => {
    const params = getValidatedParams<PhotoParams>(request);
    const meal = await this.service.removePhoto(userId(request), params.id, params.assetId);
    response.json({ success: true, data: meal });
  };

  reorderPhotos = async (request: Request, response: Response): Promise<void> => {
    const meal = await this.service.reorderPhotos(
      userId(request),
      getValidatedParams<IdParams>(request).id,
      getValidatedBody<ReorderPhotosInput>(request),
    );
    response.json({ success: true, data: meal });
  };
}
