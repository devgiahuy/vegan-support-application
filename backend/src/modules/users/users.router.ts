import { Router } from 'express';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { UsersController } from './users.controller.js';

export function createUsersRouter(
  controller: UsersController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.get('/me', authentication.authenticate, controller.getMe);
  return router;
}
