import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import { getValidatedBody, getValidatedParams } from '../../common/validation/validate-request.js';
import {
  reviewNutritionPanelResponseSchema,
  type ReviewNutritionOverrideInput,
  type RevisionIdParams,
} from './recipe-nutrition-review.schemas.js';
import type {
  NutritionReviewActor,
  RecipeNutritionReviewService,
} from './recipe-nutrition-review.service.js';

function reviewer(request: Request): NutritionReviewActor {
  if (!request.auth) {
    throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
  }
  return { userId: request.auth.userId, role: request.auth.role };
}

export class RecipeNutritionReviewController {
  constructor(private readonly service: RecipeNutritionReviewService) {}

  panel = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<RevisionIdParams>(request);
    const data = await this.service.panel(id, reviewer(request));
    response
      .status(200)
      .json(reviewNutritionPanelResponseSchema.parse({ success: true, data, meta: null }));
  };

  setOverrides = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<RevisionIdParams>(request);
    const data = await this.service.setOverrides(
      id,
      reviewer(request),
      getValidatedBody<ReviewNutritionOverrideInput>(request),
    );
    response
      .status(200)
      .json(reviewNutritionPanelResponseSchema.parse({ success: true, data, meta: null }));
  };

  recalculate = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<RevisionIdParams>(request);
    const data = await this.service.recalculate(id, reviewer(request));
    response
      .status(202)
      .json(reviewNutritionPanelResponseSchema.parse({ success: true, data, meta: null }));
  };
}
