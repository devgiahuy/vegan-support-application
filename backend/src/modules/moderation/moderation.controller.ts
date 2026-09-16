import { ModerationDecision } from '@prisma/client';
import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import type { ModerationActor } from './moderation.repository.js';
import {
  adminCommentListResponseSchema,
  adminCommentResponseSchema,
  adminUserListResponseSchema,
  adminUserResponseSchema,
  reportListResponseSchema,
  reportResponseSchema,
  reviewQueueItemResponseSchema,
  reviewQueueListResponseSchema,
  type AdminCommentsQuery,
  type AdminReportsQuery,
  type AdminUsersQuery,
  type CreateReportInput,
  type ModerationIdParams,
  type ResolveReportInput,
  type ReviewDecisionInput,
  type ReviewQueueQuery,
  type UpdateCommentStatusInput,
  type UpdateUserStatusInput,
} from './moderation.schemas.js';
import type { ModerationService } from './moderation.service.js';

function actor(request: Request): ModerationActor {
  if (request.auth) return request.auth;
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
}

function userId(request: Request): string {
  return actor(request).userId;
}

export class ModerationController {
  constructor(private readonly service: ModerationService) {}

  listReviewQueue = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listReviewQueue(
      actor(request),
      getValidatedQuery<ReviewQueueQuery>(request),
    );
    response.status(200).json(
      reviewQueueListResponseSchema.parse({
        success: true,
        data: result.data,
        meta: result.meta,
      }),
    );
  };

  approvePost = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.reviewPost(
      actor(request),
      getValidatedParams<ModerationIdParams>(request).id,
      ModerationDecision.APPROVE,
      getValidatedBody<ReviewDecisionInput>(request),
    );
    response
      .status(200)
      .json(reviewQueueItemResponseSchema.parse({ success: true, data, meta: null }));
  };

  rejectPost = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.reviewPost(
      actor(request),
      getValidatedParams<ModerationIdParams>(request).id,
      ModerationDecision.REJECT,
      getValidatedBody<ReviewDecisionInput>(request),
    );
    response
      .status(200)
      .json(reviewQueueItemResponseSchema.parse({ success: true, data, meta: null }));
  };

  createReport = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.createReport(
      userId(request),
      getValidatedBody<CreateReportInput>(request),
    );
    response.status(201).json(reportResponseSchema.parse({ success: true, data, meta: null }));
  };

  listReports = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listReports(getValidatedQuery<AdminReportsQuery>(request));
    response
      .status(200)
      .json(
        reportListResponseSchema.parse({ success: true, data: result.data, meta: result.meta }),
      );
  };

  resolveReport = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.resolveReport(
      userId(request),
      getValidatedParams<ModerationIdParams>(request).id,
      getValidatedBody<ResolveReportInput>(request),
    );
    response.status(200).json(reportResponseSchema.parse({ success: true, data, meta: null }));
  };

  listUsers = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listUsers(getValidatedQuery<AdminUsersQuery>(request));
    response
      .status(200)
      .json(
        adminUserListResponseSchema.parse({ success: true, data: result.data, meta: result.meta }),
      );
  };

  updateUserStatus = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.updateUserStatus(
      userId(request),
      getValidatedParams<ModerationIdParams>(request).id,
      getValidatedBody<UpdateUserStatusInput>(request),
    );
    response.status(200).json(adminUserResponseSchema.parse({ success: true, data, meta: null }));
  };

  listComments = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listComments(getValidatedQuery<AdminCommentsQuery>(request));
    response
      .status(200)
      .json(
        adminCommentListResponseSchema.parse({
          success: true,
          data: result.data,
          meta: result.meta,
        }),
      );
  };

  updateCommentStatus = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.updateCommentStatus(
      userId(request),
      getValidatedParams<ModerationIdParams>(request).id,
      getValidatedBody<UpdateCommentStatusInput>(request),
    );
    response
      .status(200)
      .json(adminCommentResponseSchema.parse({ success: true, data, meta: null }));
  };
}
