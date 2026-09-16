import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import { getValidatedBody, getValidatedQuery } from '../../common/validation/validate-request.js';
import type { RecommendationService } from './recommendation.service.js';
import {
  behaviorEventResponseSchema,
  deleteBehaviorHistoryResponseSchema,
  personalizationResponseSchema,
  recommendationResponseSchema,
  type CreateBehaviorEventInput,
  type RecommendationQuery,
  type UpdatePersonalizationInput,
} from './recommendation.schemas.js';

function userId(request: Request): string {
  if (request.auth) return request.auth.userId;
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
}

export class RecommendationController {
  constructor(private readonly service: RecommendationService) {}

  getPreference = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.getPreference(userId(request));
    response
      .status(200)
      .json(personalizationResponseSchema.parse({ success: true, data, meta: null }));
  };

  updatePreference = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.updatePreference(
      userId(request),
      getValidatedBody<UpdatePersonalizationInput>(request),
    );
    response
      .status(200)
      .json(personalizationResponseSchema.parse({ success: true, data, meta: null }));
  };

  deleteHistory = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.deleteHistory(userId(request));
    response
      .status(200)
      .json(deleteBehaviorHistoryResponseSchema.parse({ success: true, data, meta: null }));
  };

  createEvent = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.ingest(
      userId(request),
      getValidatedBody<CreateBehaviorEventInput>(request),
    );
    response
      .status(data.deduplicated ? 200 : 201)
      .json(behaviorEventResponseSchema.parse({ success: true, data, meta: null }));
  };

  recommend = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.recommend(
      userId(request),
      getValidatedQuery<RecommendationQuery>(request),
    );
    response
      .status(200)
      .json(
        recommendationResponseSchema.parse({ success: true, data: result.data, meta: result.meta }),
      );
  };
}
