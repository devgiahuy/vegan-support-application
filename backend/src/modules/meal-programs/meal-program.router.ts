import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { MealProgramController } from './meal-program.controller.js';
import {
  createMealProgramRequestSchema,
  mealProgramListQuerySchema,
  mealProgramParamsSchema,
  patchMealProgramRequestSchema,
} from './meal-program.schemas.js';

export function createMealProgramRouter(
  controller: MealProgramController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate);
  router.post('/', validateBody(createMealProgramRequestSchema), controller.create);
  router.get('/', validateQuery(mealProgramListQuerySchema), controller.list);
  router.get('/:id', validateParams(mealProgramParamsSchema), controller.get);
  router.patch(
    '/:id',
    validateParams(mealProgramParamsSchema),
    validateBody(patchMealProgramRequestSchema),
    controller.patch,
  );
  return router;
}
