import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import type { CommunityActor, CommunityService } from './community.service.js';
import {
  bookmarkListResponseSchema,
  bookmarkResponseSchema,
  commentListResponseSchema,
  commentResponseSchema,
  communitySummaryResponseSchema,
  ratingResponseSchema,
  voteResponseSchema,
  type BookmarkListQuery,
  type CommentListQuery,
  type CommentParams,
  type CommunityPostParams,
  type CreateCommentInput,
  type RatingInput,
  type UpdateCommentInput,
} from './community.schemas.js';

function actorFromRequest(request: Request): CommunityActor {
  if (request.auth) return { userId: request.auth.userId, role: request.auth.role };
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
}

export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  listComments = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<CommunityPostParams>(request);
    const result = await this.service.listComments(
      id,
      getValidatedQuery<CommentListQuery>(request),
    );
    response
      .status(200)
      .json(
        commentListResponseSchema.parse({ success: true, data: result.data, meta: result.meta }),
      );
  };

  createComment = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<CommunityPostParams>(request);
    const data = await this.service.createComment(
      actorFromRequest(request),
      id,
      getValidatedBody<CreateCommentInput>(request),
    );
    response.status(201).json(commentResponseSchema.parse({ success: true, data, meta: null }));
  };

  updateComment = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<CommentParams>(request);
    const data = await this.service.updateComment(
      actorFromRequest(request),
      id,
      getValidatedBody<UpdateCommentInput>(request),
    );
    response.status(200).json(commentResponseSchema.parse({ success: true, data, meta: null }));
  };

  deleteComment = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<CommentParams>(request);
    const data = await this.service.deleteComment(actorFromRequest(request), id);
    response.status(200).json(commentResponseSchema.parse({ success: true, data, meta: null }));
  };

  putVote = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<CommunityPostParams>(request);
    const data = await this.service.putVote(actorFromRequest(request), id);
    response.status(200).json(voteResponseSchema.parse({ success: true, data, meta: null }));
  };

  deleteVote = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<CommunityPostParams>(request);
    const data = await this.service.deleteVote(actorFromRequest(request), id);
    response.status(200).json(voteResponseSchema.parse({ success: true, data, meta: null }));
  };

  putRating = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<CommunityPostParams>(request);
    const data = await this.service.putRating(
      actorFromRequest(request),
      id,
      getValidatedBody<RatingInput>(request),
    );
    response.status(200).json(ratingResponseSchema.parse({ success: true, data, meta: null }));
  };

  putBookmark = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<CommunityPostParams>(request);
    const data = await this.service.putBookmark(actorFromRequest(request), id);
    response.status(200).json(bookmarkResponseSchema.parse({ success: true, data, meta: null }));
  };

  deleteBookmark = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<CommunityPostParams>(request);
    const data = await this.service.deleteBookmark(actorFromRequest(request), id);
    response.status(200).json(bookmarkResponseSchema.parse({ success: true, data, meta: null }));
  };

  getSummary = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<CommunityPostParams>(request);
    const data = await this.service.getSummary(
      id,
      request.auth ? { userId: request.auth.userId, role: request.auth.role } : undefined,
    );
    response
      .status(200)
      .json(communitySummaryResponseSchema.parse({ success: true, data, meta: null }));
  };

  listBookmarks = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listBookmarks(
      actorFromRequest(request),
      getValidatedQuery<BookmarkListQuery>(request),
    );
    response
      .status(200)
      .json(
        bookmarkListResponseSchema.parse({ success: true, data: result.data, meta: result.meta }),
      );
  };
}
