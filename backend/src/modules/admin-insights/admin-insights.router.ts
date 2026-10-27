import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../../common/auth/authorization.js';
import { getValidatedQuery, validateQuery } from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { AdminInsightsService } from './admin-insights.service.js';
import {
  revenueQuerySchema,
  usageQuerySchema,
  type RevenueQuery,
  type UsageQuery,
} from './admin-insights.schemas.js';

export function createAdminInsightsRouter(
  service: AdminInsightsService,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  const admin = [authentication.authenticate, requireRole(Role.ADMIN)];
  router.get('/billing/revenue', ...admin, validateQuery(revenueQuerySchema), async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      success: true,
      data: await service.revenue(getValidatedQuery<RevenueQuery>(req)),
    });
  });
  router.get('/ai/usage', ...admin, validateQuery(usageQuerySchema), async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ success: true, ...(await service.usage(getValidatedQuery<UsageQuery>(req))) });
  });
  return router;
}
