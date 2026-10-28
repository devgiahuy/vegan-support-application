import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../../common/auth/authorization.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { RecipeNutritionController } from './recipe-nutrition.controller.js';
import type { RecipeNutritionReviewController } from './recipe-nutrition-review.controller.js';
import {
  reviewNutritionOverrideRequestSchema,
  revisionIdParamsSchema,
} from './recipe-nutrition-review.schemas.js';
import {
  nutritionHistoryQuerySchema,
  nutritionPreviewRequestSchema,
  nutritionRecalculateRequestSchema,
  postIdParamsSchema,
} from './recipe-nutrition.schemas.js';

export function createRecipeNutritionRouter(
  controller: RecipeNutritionController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.post(
    '/:id/nutrition/preview',
    authentication.optionalAuthenticate,
    validateParams(postIdParamsSchema),
    validateBody(nutritionPreviewRequestSchema),
    controller.preview,
  );
  router.post(
    '/:id/nutrition/recalculate',
    authentication.authenticate,
    validateParams(postIdParamsSchema),
    validateBody(nutritionRecalculateRequestSchema),
    controller.recalculate,
  );
  router.get(
    '/:id/nutrition/current',
    authentication.optionalAuthenticate,
    validateParams(postIdParamsSchema),
    controller.current,
  );
  router.get(
    '/:id/nutrition/history',
    authentication.optionalAuthenticate,
    validateParams(postIdParamsSchema),
    validateQuery(nutritionHistoryQuerySchema),
    controller.history,
  );
  router.get(
    '/:id/nutrition/status',
    authentication.optionalAuthenticate,
    validateParams(postIdParamsSchema),
    controller.status,
  );
  return router;
}

/** Reviewer nutrition panel for a submitted recipe revision; mounted under /api/v1/admin. */
export function createRecipeNutritionReviewRouter(
  controller: RecipeNutritionReviewController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  const requireReviewer = requireRole(Role.ADMIN, Role.CONTRIBUTOR);
  router.get(
    '/content-review/:id/nutrition',
    authentication.authenticate,
    requireReviewer,
    validateParams(revisionIdParamsSchema),
    controller.panel,
  );
  router.patch(
    '/content-review/:id/nutrition',
    authentication.authenticate,
    requireReviewer,
    validateParams(revisionIdParamsSchema),
    validateBody(reviewNutritionOverrideRequestSchema),
    controller.setOverrides,
  );
  router.post(
    '/content-review/:id/nutrition/recalculate',
    authentication.authenticate,
    requireReviewer,
    validateParams(revisionIdParamsSchema),
    controller.recalculate,
  );
  return router;
}
