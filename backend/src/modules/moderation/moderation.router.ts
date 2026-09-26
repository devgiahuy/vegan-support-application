import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../../common/auth/authorization.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { ModerationController } from './moderation.controller.js';
import {
  adminCommentsQuerySchema,
  adminContentReviewDecisionRequestSchema,
  adminReportsQuerySchema,
  adminUsersQuerySchema,
  createReportRequestSchema,
  moderationIdParamsSchema,
  resolveReportRequestSchema,
  reviewDecisionRequestSchema,
  reviewQueueQuerySchema,
  updateCommentStatusRequestSchema,
  updateUserStatusRequestSchema,
} from './moderation.schemas.js';

export function createReportsRouter(
  controller: ModerationController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate);
  router.post('/', validateBody(createReportRequestSchema), controller.createReport);
  return router;
}

export function createReviewQueueRouter(
  controller: ModerationController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(
    authentication.authenticate,
    requireRole(Role.ADMIN),
  );
  router.get('/posts', validateQuery(reviewQueueQuerySchema), controller.listReviewQueue);
  router.patch(
    '/posts/:id/approve',
    validateParams(moderationIdParamsSchema),
    validateBody(reviewDecisionRequestSchema),
    controller.approvePost,
  );
  router.patch(
    '/posts/:id/reject',
    validateParams(moderationIdParamsSchema),
    validateBody(reviewDecisionRequestSchema),
    controller.rejectPost,
  );
  return router;
}

export function createModerationAdminRouter(
  controller: ModerationController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate, requireRole(Role.ADMIN));
  router.get('/content-review', validateQuery(reviewQueueQuerySchema), controller.listReviewQueue);
  router.get(
    '/content-review/:id',
    validateParams(moderationIdParamsSchema),
    controller.getContentReviewDetail,
  );
  router.patch(
    '/content-review/:id',
    validateParams(moderationIdParamsSchema),
    validateBody(adminContentReviewDecisionRequestSchema),
    controller.reviewContent,
  );
  router.get('/reports', validateQuery(adminReportsQuerySchema), controller.listReports);
  router.patch(
    '/reports/:id/resolve',
    validateParams(moderationIdParamsSchema),
    validateBody(resolveReportRequestSchema),
    controller.resolveReport,
  );
  router.get('/users', validateQuery(adminUsersQuerySchema), controller.listUsers);
  router.patch(
    '/users/:id/status',
    validateParams(moderationIdParamsSchema),
    validateBody(updateUserStatusRequestSchema),
    controller.updateUserStatus,
  );
  router.get('/comments', validateQuery(adminCommentsQuerySchema), controller.listComments);
  router.patch(
    '/comments/:id/status',
    validateParams(moderationIdParamsSchema),
    validateBody(updateCommentStatusRequestSchema),
    controller.updateCommentStatus,
  );
  return router;
}
