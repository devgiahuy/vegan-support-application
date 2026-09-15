import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { ContentController } from './content.controller.js';
import {
  createPostRequestSchema,
  deletePostQuerySchema,
  postIdentifierParamsSchema,
  postIdParamsSchema,
  postListQuerySchema,
  relatedPostsQuerySchema,
  updatePostRequestSchema,
  uploadSignatureRequestSchema,
} from './content.schemas.js';

export function createPostsRouter(
  controller: ContentController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.get(
    '/',
    authentication.optionalAuthenticate,
    validateQuery(postListQuerySchema),
    controller.listPosts,
  );
  router.post(
    '/',
    authentication.authenticate,
    validateBody(createPostRequestSchema),
    controller.createPost,
  );
  router.get(
    '/:id/related',
    authentication.optionalAuthenticate,
    validateParams(postIdParamsSchema),
    validateQuery(relatedPostsQuerySchema),
    controller.getRelatedPosts,
  );
  router.get(
    '/:idOrSlug',
    authentication.optionalAuthenticate,
    validateParams(postIdentifierParamsSchema),
    controller.getPost,
  );
  router.patch(
    '/:id',
    authentication.authenticate,
    validateParams(postIdParamsSchema),
    validateBody(updatePostRequestSchema),
    controller.updatePost,
  );
  router.delete(
    '/:id',
    authentication.authenticate,
    validateParams(postIdParamsSchema),
    validateQuery(deletePostQuerySchema),
    controller.deletePost,
  );
  return router;
}

export function createUploadsRouter(
  controller: ContentController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.post(
    '/signature',
    authentication.authenticate,
    validateBody(uploadSignatureRequestSchema),
    controller.createUploadSignature,
  );
  return router;
}
