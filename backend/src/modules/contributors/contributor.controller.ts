import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import type { ContributorService } from './contributor.service.js';
import {
  contributorApplicationListResponseSchema,
  contributorApplicationResponseSchema,
  type AdminContributorApplicationsQuery,
  type ContributorApplicationParams,
  type OwnContributorApplicationsQuery,
  type ReviewContributorApplicationInput,
  type SubmitContributorApplicationInput,
} from './contributor.schemas.js';

function authenticatedUserId(request: Request): string {
  if (request.auth) return request.auth.userId;
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
}

export class ContributorController {
  constructor(private readonly service: ContributorService) {}

  submit = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.submit(
      authenticatedUserId(request),
      getValidatedBody<SubmitContributorApplicationInput>(request),
    );
    response
      .status(201)
      .json(contributorApplicationResponseSchema.parse({ success: true, data, meta: null }));
  };

  listOwn = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listOwn(
      authenticatedUserId(request),
      getValidatedQuery<OwnContributorApplicationsQuery>(request),
    );
    response.status(200).json(
      contributorApplicationListResponseSchema.parse({
        success: true,
        data: result.data,
        meta: result.meta,
      }),
    );
  };

  listAdmin = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listAdmin(
      getValidatedQuery<AdminContributorApplicationsQuery>(request),
    );
    response.status(200).json(
      contributorApplicationListResponseSchema.parse({
        success: true,
        data: result.data,
        meta: result.meta,
      }),
    );
  };

  review = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<ContributorApplicationParams>(request);
    const data = await this.service.review(
      authenticatedUserId(request),
      id,
      getValidatedBody<ReviewContributorApplicationInput>(request),
    );
    response
      .status(200)
      .json(contributorApplicationResponseSchema.parse({ success: true, data, meta: null }));
  };
}
