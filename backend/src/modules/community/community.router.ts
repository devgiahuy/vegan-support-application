import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { CommunityController } from './community.controller.js';
import {
  bookmarkListQuerySchema,
  commentListQuerySchema,
  commentParamsSchema,
  communityPostParamsSchema,
  createCommentRequestSchema,
  ratingRequestSchema,
  updateCommentRequestSchema,
} from './community.schemas.js';

export function createCommunityPostsRouter(
  controller: CommunityController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.get(
    '/:id/comments',
    validateParams(communityPostParamsSchema),
    validateQuery(commentListQuerySchema),
    controller.listComments,
  );
  router.post(
    '/:id/comments',
    authentication.authenticate,
    validateParams(communityPostParamsSchema),
    validateBody(createCommentRequestSchema),
    controller.createComment,
  );
  router.get(
    '/:id/community-summary',
    authentication.optionalAuthenticate,
    validateParams(communityPostParamsSchema),
    controller.getSummary,
  );
  router.put(
    '/:id/vote',
    authentication.authenticate,
    validateParams(communityPostParamsSchema),
    controller.putVote,
  );
  router.delete(
    '/:id/vote',
    authentication.authenticate,
    validateParams(communityPostParamsSchema),
    controller.deleteVote,
  );
  router.put(
    '/:id/rating',
    authentication.authenticate,
    validateParams(communityPostParamsSchema),
    validateBody(ratingRequestSchema),
    controller.putRating,
  );
  router.put(
    '/:id/bookmark',
    authentication.authenticate,
    validateParams(communityPostParamsSchema),
    controller.putBookmark,
  );
  router.delete(
    '/:id/bookmark',
    authentication.authenticate,
    validateParams(communityPostParamsSchema),
    controller.deleteBookmark,
  );
  return router;
}

export function createCommentsRouter(
  controller: CommunityController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.patch(
    '/:id',
    authentication.authenticate,
    validateParams(commentParamsSchema),
    validateBody(updateCommentRequestSchema),
    controller.updateComment,
  );
  router.delete(
    '/:id',
    authentication.authenticate,
    validateParams(commentParamsSchema),
    controller.deleteComment,
  );
  return router;
}

export function createCommunityUsersRouter(
  controller: CommunityController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.get(
    '/me/bookmarks',
    authentication.authenticate,
    validateQuery(bookmarkListQuerySchema),
    controller.listBookmarks,
  );
  return router;
}
