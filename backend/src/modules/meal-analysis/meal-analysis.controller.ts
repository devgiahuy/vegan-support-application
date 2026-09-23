import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import { getValidatedBody, getValidatedParams } from '../../common/validation/validate-request.js';
import { mealAnalysisResponseSchema, type MealAnalysisInput } from './meal-analysis.schemas.js';
import type { MealAnalysisService } from './meal-analysis.service.js';

function userId(request: Request): string {
  if (request.auth) return request.auth.userId;
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
}

export class MealAnalysisController {
  constructor(private readonly service: MealAnalysisService) {}

  analyze = async (request: Request, response: Response): Promise<void> => {
    const params = getValidatedParams<{ id: string }>(request);
    const data = await this.service.analyze(
      userId(request),
      params.id,
      getValidatedBody<MealAnalysisInput>(request),
    );
    response
      .status(201)
      .json(mealAnalysisResponseSchema.parse({ success: true, data, meta: null }));
  };

  current = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.getCurrent(
      userId(request),
      getValidatedParams<{ id: string }>(request).id,
    );
    response
      .status(200)
      .json(mealAnalysisResponseSchema.parse({ success: true, data, meta: null }));
  };
}
