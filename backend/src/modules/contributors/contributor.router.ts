import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../../common/auth/authorization.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { ContributorController } from './contributor.controller.js';
import {
  adminContributorApplicationsQuerySchema,
  contributorApplicationParamsSchema,
  ownContributorApplicationsQuerySchema,
  reviewContributorApplicationRequestSchema,
  submitContributorApplicationRequestSchema,
} from './contributor.schemas.js';

export function createContributorApplicationsRouter(
  controller: ContributorController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate);
  router.post('/', validateBody(submitContributorApplicationRequestSchema), controller.submit);
  router.get('/me', validateQuery(ownContributorApplicationsQuerySchema), controller.listOwn);
  return router;
}

export function createContributorAdminRouter(
  controller: ContributorController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate, requireRole(Role.ADMIN));
  router.get(
    '/contributor-applications',
    validateQuery(adminContributorApplicationsQuerySchema),
    controller.listAdmin,
  );
  router.patch(
    '/contributor-applications/:id/review',
    validateParams(contributorApplicationParamsSchema),
    validateBody(reviewContributorApplicationRequestSchema),
    controller.review,
  );
  return router;
}
