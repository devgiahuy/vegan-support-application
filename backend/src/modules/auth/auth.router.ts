import { Router } from 'express';
import { validateBody } from '../../common/validation/validate-request.js';
import type { AuthController } from './auth.controller.js';
import { loginRequestSchema, logoutRequestSchema, registerRequestSchema } from './auth.schemas.js';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();
  router.post('/register', validateBody(registerRequestSchema), controller.register);
  router.post('/login', validateBody(loginRequestSchema), controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', validateBody(logoutRequestSchema), controller.logout);
  return router;
}
