import { Router } from 'express';
import { validateBody } from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { RecipeDraftController } from './recipe-draft.controller.js';
import { generateRecipeDraftRequestSchema } from './recipe-draft.schemas.js';

export function createRecipeDraftRouter(
  controller: RecipeDraftController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.post(
    '/generate',
    authentication.authenticate,
    validateBody(generateRecipeDraftRequestSchema),
    controller.generate,
  );
  return router;
}
