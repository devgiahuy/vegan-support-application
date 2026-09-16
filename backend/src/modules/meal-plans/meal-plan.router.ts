import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { MealPlanController } from './meal-plan.controller.js';
import {
  deleteMealPlanQuerySchema,
  generateMealPlanRequestSchema,
  mealPlanItemParamsSchema,
  mealPlanListQuerySchema,
  mealPlanParamsSchema,
  swapMealPlanItemRequestSchema,
} from './meal-plan.schemas.js';

export function createMealPlanRouter(
  controller: MealPlanController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate);
  router.post('/generate', validateBody(generateMealPlanRequestSchema), controller.generate);
  router.get('/', validateQuery(mealPlanListQuerySchema), controller.list);
  router.get('/:id', validateParams(mealPlanParamsSchema), controller.get);
  router.patch(
    '/:id/items/:itemId/swap',
    validateParams(mealPlanItemParamsSchema),
    validateBody(swapMealPlanItemRequestSchema),
    controller.swap,
  );
  router.delete(
    '/:id',
    validateParams(mealPlanParamsSchema),
    validateQuery(deleteMealPlanQuerySchema),
    controller.delete,
  );
  return router;
}
