import type { DietaryImpactService } from '../dietary-impact/dietary-impact.service.js';
import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import {
  deleteMealPlanResponseSchema,
  mealPlanListResponseSchema,
  mealPlanResponseSchema,
  type DeleteMealPlanQuery,
  type GenerateMealPlanInput,
  type MealPlanItemParams,
  type MealPlanListQuery,
  type MealPlanParams,
  type ManualAddMealPlanItemInput,
  type SwapMealPlanItemInput,
} from './meal-plan.schemas.js';
import type { MealPlanService } from './meal-plan.service.js';

function userId(request: Request): string {
  if (request.auth) return request.auth.userId;
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
}

export class MealPlanController {
  constructor(
    private readonly service: MealPlanService,
    private readonly impact: DietaryImpactService,
  ) {}

  generate = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.generate(
      userId(request),
      getValidatedBody<GenerateMealPlanInput>(request),
    );
    response
      .status(201)
      .json(
        mealPlanResponseSchema.parse({
          success: true,
          data: {
            ...data,
            compatibility: await this.impact.planCompatibility(userId(request), data.id),
          },
          meta: null,
        }),
      );
  };

  list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(
      userId(request),
      getValidatedQuery<MealPlanListQuery>(request),
    );
    response
      .status(200)
      .json(
        mealPlanListResponseSchema.parse({
          success: true,
          data: await Promise.all(
            result.data.map(async (plan) => ({
              ...plan,
              compatibility: await this.impact.planCompatibility(userId(request), plan.id),
            })),
          ),
          meta: result.meta,
        }),
      );
  };

  get = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.get(
      userId(request),
      getValidatedParams<MealPlanParams>(request).id,
    );
    response
      .status(200)
      .json(
        mealPlanResponseSchema.parse({
          success: true,
          data: {
            ...data,
            compatibility: await this.impact.planCompatibility(userId(request), data.id),
          },
          meta: null,
        }),
      );
  };

  swap = async (request: Request, response: Response): Promise<void> => {
    const params = getValidatedParams<MealPlanItemParams>(request);
    const data = await this.service.swap(
      userId(request),
      params.id,
      params.itemId,
      getValidatedBody<SwapMealPlanItemInput>(request),
    );
    response
      .status(200)
      .json(
        mealPlanResponseSchema.parse({
          success: true,
          data: {
            ...data,
            compatibility: await this.impact.planCompatibility(userId(request), data.id),
          },
          meta: null,
        }),
      );
  };

  manualAdd = async (request: Request, response: Response): Promise<void> => {
    const params = getValidatedParams<MealPlanItemParams>(request);
    const data = await this.service.manualAdd(
      userId(request),
      params.id,
      params.itemId,
      getValidatedBody<ManualAddMealPlanItemInput>(request),
    );
    response
      .status(200)
      .json(
        mealPlanResponseSchema.parse({
          success: true,
          data: {
            ...data,
            compatibility: await this.impact.planCompatibility(userId(request), data.id),
          },
          meta: null,
        }),
      );
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.delete(
      userId(request),
      getValidatedParams<MealPlanParams>(request).id,
      getValidatedQuery<DeleteMealPlanQuery>(request),
    );
    response
      .status(200)
      .json(deleteMealPlanResponseSchema.parse({ success: true, data, meta: null }));
  };
}
