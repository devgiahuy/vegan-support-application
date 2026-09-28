import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../../common/auth/authorization.js';
import { validateBody, validateParams, validateQuery } from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { AiGovernanceController } from './ai-governance.controller.js';
import { governanceAuditQuerySchema, governanceControlSchema, governanceFeatureParamsSchema, governanceFlagQuerySchema, governanceListQuerySchema, governanceMetricsQuerySchema } from './ai-governance.schemas.js';

export function createAiGovernanceRouter(controller: AiGovernanceController, authentication: AuthenticationMiddleware): Router {
  const router = Router();
  router.use(authentication.authenticate, requireRole(Role.ADMIN));
  router.get('/ai/requests', validateQuery(governanceListQuerySchema), controller.requests);
  router.get('/ai/metrics', validateQuery(governanceMetricsQuerySchema), controller.metrics);
  router.get('/ai/flags', validateQuery(governanceFlagQuerySchema), controller.flags);
  router.get('/ai/features', controller.features);
  router.get('/ai/features/audit', validateQuery(governanceAuditQuerySchema), controller.controlAudit);
  router.patch('/ai/features/:feature', validateParams(governanceFeatureParamsSchema), validateBody(governanceControlSchema), controller.setFeature);
  router.get('/ai/health', controller.health);
  return router;
}
