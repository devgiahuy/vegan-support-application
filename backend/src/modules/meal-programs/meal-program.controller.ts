import type { DietaryImpactService } from '../dietary-impact/dietary-impact.service.js';
import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import {
  mealProgramListResponseSchema,
  mealProgramResponseSchema,
  type CreateMealProgramInput,
  type MealProgramListQuery,
  type PatchMealProgramInput,
} from './meal-program.schemas.js';
import type { MealProgramService } from './meal-program.service.js';

function userId(request: Request): string {
  if (request.auth) return request.auth.userId;
  throw new AppError({
    statusCode: 401,
    code: 'AUTH_REQUIRED',
    message: 'Authentication required',
  });
}

export class MealProgramController {
  constructor(
    private readonly service: MealProgramService,
    private readonly impact: DietaryImpactService,
  ) {}
  create = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.create(
      userId(request),
      getValidatedBody<CreateMealProgramInput>(request),
    );
    response
      .status(201)
      .json(
        mealProgramResponseSchema.parse({
          success: true,
          data: {
            ...data,
            compatibility: await this.impact.programCompatibility(userId(request), data.id),
          },
          meta: null,
        }),
      );
  };
  list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(
      userId(request),
      getValidatedQuery<MealProgramListQuery>(request),
    );
    response.status(200).json(
      mealProgramListResponseSchema.parse({
        success: true,
        data: await Promise.all(
          result.data.map(async (program) => ({
            ...program,
            compatibility: await this.impact.programCompatibility(userId(request), program.id),
          })),
        ),
        meta: result.meta,
      }),
    );
  };
  get = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.get(
      userId(request),
      getValidatedParams<{ id: string }>(request).id,
    );
    response
      .status(200)
      .json(
        mealProgramResponseSchema.parse({
          success: true,
          data: {
            ...data,
            compatibility: await this.impact.programCompatibility(userId(request), data.id),
          },
          meta: null,
        }),
      );
  };
  patch = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.patch(
      userId(request),
      getValidatedParams<{ id: string }>(request).id,
      getValidatedBody<PatchMealProgramInput>(request),
    );
    response
      .status(200)
      .json(
        mealProgramResponseSchema.parse({
          success: true,
          data: {
            ...data,
            compatibility: await this.impact.programCompatibility(userId(request), data.id),
          },
          meta: null,
        }),
      );
  };
}
