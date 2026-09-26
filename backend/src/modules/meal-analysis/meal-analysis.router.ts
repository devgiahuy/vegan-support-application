import { Router } from 'express';
import { validateBody, validateParams } from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { MealAnalysisController } from './meal-analysis.controller.js';
import { mealAnalysisParamsSchema, mealAnalysisRequestSchema } from './meal-analysis.schemas.js';

export function createMealAnalysisRouter(
  controller: MealAnalysisController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate);
  router.post(
    '/:id/analyze',
    validateParams(mealAnalysisParamsSchema),
    validateBody(mealAnalysisRequestSchema),
    controller.analyze,
  );
  router.get('/:id/analysis', validateParams(mealAnalysisParamsSchema), controller.current);
  return router;
}
