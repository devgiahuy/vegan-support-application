import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import { getValidatedBody, getValidatedParams } from '../../common/validation/validate-request.js';
import type {
  ConfirmRecognitionJobInput,
  CreateRecognitionJobInput,
  RetryRecognitionJobInput,
  UpdateRecognitionCandidateInput,
} from './ingredient-recognition.schemas.js';
import type { IngredientRecognitionService } from './ingredient-recognition.service.js';

function ownerId(request: Request): string {
  if (request.auth) return request.auth.userId;
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Authentication required' });
}

export class IngredientRecognitionController {
  constructor(private readonly service: IngredientRecognitionService) {}

  create = async (request: Request, response: Response): Promise<void> => {
    const job = await this.service.create(
      ownerId(request),
      getValidatedBody<CreateRecognitionJobInput>(request),
    );
    response.status(202).json({ success: true, data: job });
  };

  get = async (request: Request, response: Response): Promise<void> => {
    const job = await this.service.get(
      ownerId(request),
      getValidatedParams<{ id: string }>(request).id,
    );
    response.json({ success: true, data: job });
  };

  updateCandidate = async (request: Request, response: Response): Promise<void> => {
    const params = getValidatedParams<{ id: string; candidateId: string }>(request);
    const job = await this.service.updateCandidate(
      ownerId(request),
      params.id,
      params.candidateId,
      getValidatedBody<UpdateRecognitionCandidateInput>(request),
    );
    response.json({ success: true, data: job });
  };

  confirm = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.confirm(
      ownerId(request),
      getValidatedParams<{ id: string }>(request).id,
      getValidatedBody<ConfirmRecognitionJobInput>(request),
    );
    response.json({ success: true, data: result });
  };

  cancel = async (request: Request, response: Response): Promise<void> => {
    const job = await this.service.cancel(
      ownerId(request),
      getValidatedParams<{ id: string }>(request).id,
    );
    response.json({ success: true, data: job });
  };

  retry = async (request: Request, response: Response): Promise<void> => {
    const job = await this.service.retry(
      ownerId(request),
      getValidatedParams<{ id: string }>(request).id,
      getValidatedBody<RetryRecognitionJobInput>(request),
    );
    response.status(202).json({ success: true, data: job });
  };
}
