import { Router } from 'express';
import { validateBody } from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import { dietRuleSelectionSchema } from '../profile/profile.schemas.js';
import type { DietController } from './diet.controller.js';

export function createDietRouter(
  controller: DietController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.post(
    '/preview',
    authentication.authenticate,
    validateBody(dietRuleSelectionSchema),
    controller.previewRules,
  );
  return router;
}
