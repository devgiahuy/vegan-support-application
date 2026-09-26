import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import {
  nutritionEstimateResponseSchema,
  nutritionHistoryResponseSchema,
  nutritionStatusResponseSchema,
  type NutritionHistoryQuery,
  type NutritionPreviewInput,
  type NutritionRecalculateInput,
  type PostIdParams,
} from './recipe-nutrition.schemas.js';
import type { NutritionActor } from './recipe-nutrition.repository.js';
import type { RecipeNutritionService } from './recipe-nutrition.service.js';

function optionalActor(request: Request): NutritionActor | undefined {
  return request.auth ? { userId: request.auth.userId, role: request.auth.role } : undefined;
}

function requiredActor(request: Request): NutritionActor {
  const actor = optionalActor(request);
  if (!actor) {
    throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui long dang nhap' });
  }
  return actor;
}

export class RecipeNutritionController {
  constructor(private readonly service: RecipeNutritionService) {}

  preview = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<PostIdParams>(request);
    const data = await this.service.preview(
      id,
      getValidatedBody<NutritionPreviewInput>(request),
      optionalActor(request),
    );
    response
      .status(200)
      .json(nutritionEstimateResponseSchema.parse({ success: true, data, meta: null }));
  };

  recalculate = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<PostIdParams>(request);
    const data = await this.service.recalculate(
      id,
      getValidatedBody<NutritionRecalculateInput>(request),
      requiredActor(request),
    );
    response
      .status(201)
      .json(nutritionEstimateResponseSchema.parse({ success: true, data, meta: null }));
  };

  current = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<PostIdParams>(request);
    const data = await this.service.current(id, optionalActor(request));
    response
      .status(200)
      .json(nutritionEstimateResponseSchema.parse({ success: true, data, meta: null }));
  };

  history = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<PostIdParams>(request);
    const result = await this.service.history(
      id,
      getValidatedQuery<NutritionHistoryQuery>(request),
      optionalActor(request),
    );
    response.status(200).json(
      nutritionHistoryResponseSchema.parse({
        success: true,
        data: result.data,
        meta: result.meta,
      }),
    );
  };

  status = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<PostIdParams>(request);
    const data = await this.service.status(id, optionalActor(request));
    response
      .status(200)
      .json(nutritionStatusResponseSchema.parse({ success: true, data, meta: null }));
  };
}
