import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../../common/auth/authorization.js';
import {
  ContributorPermission,
  requireContributorPermission,
} from '../../common/auth/contributor-permissions.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { AiReviewController } from './ai-review.controller.js';
import {
  adminAiVerificationActionSchema,
  aiArtifactParamsSchema,
  aiVerificationParamsSchema,
  createAiArtifactSchema,
  createAiVerificationSchema,
  publicAiArtifactsQuerySchema,
  submitAiArtifactSchema,
  updateAiArtifactVisibilitySchema,
} from './ai-review.schemas.js';

export function createAiReviewRouter(
  controller: AiReviewController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.get('/ai-artifacts/public', validateQuery(publicAiArtifactsQuerySchema), controller.listPublic);
  router.post('/ai-artifacts', authentication.authenticate, validateBody(createAiArtifactSchema), controller.create);
  router.patch(
    '/ai-artifacts/:id/visibility',
    authentication.authenticate,
    validateParams(aiArtifactParamsSchema),
    validateBody(updateAiArtifactVisibilitySchema),
    controller.updateVisibility,
  );
  router.post(
    '/ai-artifacts/:id/submit',
    authentication.authenticate,
    validateParams(aiArtifactParamsSchema),
    validateBody(submitAiArtifactSchema),
    controller.submit,
  );
  router.post(
    '/ai-artifacts/:id/verifications',
    authentication.authenticate,
    requireContributorPermission(ContributorPermission.VERIFY_NUTRITION_AI),
    validateParams(aiArtifactParamsSchema),
    validateBody(createAiVerificationSchema),
    controller.verify,
  );
  return router;
}

export function createAiReviewAdminRouter(
  controller: AiReviewController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.patch(
    '/ai-verifications/:id',
    authentication.authenticate,
    requireRole(Role.ADMIN),
    validateParams(aiVerificationParamsSchema),
    validateBody(adminAiVerificationActionSchema),
    controller.adminAction,
  );
  return router;
}
