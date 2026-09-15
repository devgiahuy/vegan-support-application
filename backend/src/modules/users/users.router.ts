import { Router } from 'express';
import { validateBody } from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import {
  healthProfileRequestSchema,
  saveDietPreferencesRequestSchema,
  updateBasicProfileRequestSchema,
  updateDietScheduleRequestSchema,
} from '../profile/profile.schemas.js';
import type { UsersController } from './users.controller.js';

export function createUsersRouter(
  controller: UsersController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.get('/me', authentication.authenticate, controller.getMe);
  router.patch(
    '/me',
    authentication.authenticate,
    validateBody(updateBasicProfileRequestSchema),
    controller.updateMe,
  );
  router.put(
    '/me/health-profile',
    authentication.authenticate,
    validateBody(healthProfileRequestSchema),
    controller.updateHealthProfile,
  );
  router.put(
    '/me/diet-preferences',
    authentication.authenticate,
    validateBody(saveDietPreferencesRequestSchema),
    controller.saveDietPreferences,
  );
  router.put(
    '/me/diet-schedule',
    authentication.authenticate,
    validateBody(updateDietScheduleRequestSchema),
    controller.updateDietSchedule,
  );
  return router;
}
