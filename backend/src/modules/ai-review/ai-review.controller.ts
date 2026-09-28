import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import type { AiReviewService } from './ai-review.service.js';
import type {
  AdminAiVerificationActionInput,
  CreateAiArtifactInput,
  CreateAiVerificationInput,
  PublicAiArtifactsQuery,
  SubmitAiArtifactInput,
  UpdateAiArtifactVisibilityInput,
} from './ai-review.schemas.js';

function authenticated(request: Request) {
  if (request.auth) return request.auth;
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Authentication required.' });
}

export class AiReviewController {
  constructor(private readonly service: AiReviewService) {}

  create = async (request: Request, response: Response): Promise<void> => {
    const artifact = await this.service.create(
      authenticated(request).userId,
      getValidatedBody<CreateAiArtifactInput>(request),
    );
    response.status(201).json({ success: true, data: artifact });
  };

  updateVisibility = async (request: Request, response: Response): Promise<void> => {
    const artifact = await this.service.updateVisibility(
      authenticated(request).userId,
      getValidatedParams<{ id: string }>(request).id,
      getValidatedBody<UpdateAiArtifactVisibilityInput>(request),
    );
    response.json({ success: true, data: artifact });
  };

  submit = async (request: Request, response: Response): Promise<void> => {
    const artifact = await this.service.submit(
      authenticated(request).userId,
      getValidatedParams<{ id: string }>(request).id,
      getValidatedBody<SubmitAiArtifactInput>(request),
    );
    response.json({ success: true, data: artifact });
  };

  listPublic = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listPublic(getValidatedQuery<PublicAiArtifactsQuery>(request));
    response.json({ success: true, ...result });
  };

  verify = async (request: Request, response: Response): Promise<void> => {
    const actor = authenticated(request);
    const result = await this.service.verify(
      { userId: actor.userId, role: actor.role },
      getValidatedParams<{ id: string }>(request).id,
      getValidatedBody<CreateAiVerificationInput>(request),
    );
    response.status(201).json({ success: true, data: result });
  };

  adminAction = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.adminAction(
      authenticated(request).userId,
      getValidatedParams<{ id: string }>(request).id,
      getValidatedBody<AdminAiVerificationActionInput>(request),
    );
    response.json({ success: true, data: result });
  };
}
