import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { RecipeNutritionController } from './recipe-nutrition.controller.js';
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
