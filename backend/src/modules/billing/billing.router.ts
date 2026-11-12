import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireRole } from '../../common/auth/authorization.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { BillingService } from './billing.service.js';
import {
  billingIdSchema,
  billingListQuerySchema,
  createBillingOrderSchema,
  adminBillingProductParamsSchema,
  adminBillingCreateSchema,
  adminBillingUpdateSchema,
  adminBillingAvailabilitySchema,
  type AdminBillingCreate,
  type AdminBillingUpdate,
  type AdminBillingAvailability,
} from './billing.schemas.js';

export function createBillingRouter(
  service: BillingService,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.post(
    '/admin/billing/products',
    authentication.authenticate,
    requireRole(Role.ADMIN),
    validateBody(adminBillingCreateSchema),
    async (req, res) => {
      res.setHeader('Cache-Control', 'private, no-store');
      res.status(201).json({
        success: true,
        data: await service.adminCreateProduct(
          req.auth!.userId,
          getValidatedBody<AdminBillingCreate>(req),
        ),
      });
    },
  );
  router.patch(
    '/admin/billing/products/:id',
    authentication.authenticate,
    requireRole(Role.ADMIN),
    validateParams(adminBillingProductParamsSchema),
    validateBody(adminBillingUpdateSchema),
    async (req, res) => {
      res.setHeader('Cache-Control', 'private, no-store');
      res.json({
        success: true,
        data: await service.adminUpdateProduct(
          req.auth!.userId,
          getValidatedParams<{ id: string }>(req).id,
          getValidatedBody<AdminBillingUpdate>(req),
        ),
      });
    },
  );
  router.post(
    '/admin/billing/products/:id/availability',
    authentication.authenticate,
    requireRole(Role.ADMIN),
    validateParams(adminBillingProductParamsSchema),
    validateBody(adminBillingAvailabilitySchema),
    async (req, res) => {
      res.setHeader('Cache-Control', 'private, no-store');
      res.json({
        success: true,
        data: await service.adminSetProductAvailability(
          req.auth!.userId,
          getValidatedParams<{ id: string }>(req).id,
          getValidatedBody<AdminBillingAvailability>(req),
        ),
      });
    },
  );
  router.get(
    '/admin/billing/products',
    authentication.authenticate,
    requireRole(Role.ADMIN),
    async (_req, res) => {
      res.setHeader('Cache-Control', 'private, no-store');
      res.json({ success: true, data: await service.adminProducts() });
    },
  );
  router.get(
    '/admin/billing/products/:id',
    authentication.authenticate,
    requireRole(Role.ADMIN),
    validateParams(adminBillingProductParamsSchema),
    async (req, res) => {
      res.setHeader('Cache-Control', 'private, no-store');
      const { id } = getValidatedParams<{ id: string }>(req);
      res.json({ success: true, data: await service.adminProductById(id) });
    },
  );
  router.get('/billing/products', authentication.authenticate, async (_req, res) => {
    res.json({ success: true, data: await service.products() });
  });
  router.get('/entitlements/me', authentication.authenticate, async (req, res) => {
    res.json({ success: true, data: await service.entitlements.overview(req.auth!.userId) });
  });
  router.post(
    '/billing/orders',
    authentication.authenticate,
    validateBody(createBillingOrderSchema),
    async (req, res) => {
      const input = getValidatedBody<{
        productId: string;
        idempotencyKey: string;
        expectedProductVersion?: number;
      }>(req);
      res
        .status(201)
        .json({ success: true, data: await service.create(req.auth!.userId, input, req.ip ?? '') });
    },
  );
  router.get(
    '/billing/orders',
    authentication.authenticate,
    validateQuery(billingListQuerySchema),
    async (req, res) => {
      const { page } = getValidatedQuery<{ page: number }>(req);
      res.json({ success: true, data: await service.list(req.auth!.userId, page, req.ip ?? '') });
    },
  );
  router.get(
    '/billing/orders/:id',
    authentication.authenticate,
    validateParams(billingIdSchema),
    async (req, res) => {
      res.json({
        success: true,
        data: await service.get(
          req.auth!.userId,
          getValidatedParams<{ id: string }>(req).id,
          req.ip ?? '',
        ),
      });
    },
  );
  router.post(
    '/billing/orders/:id/reconcile',
    authentication.authenticate,
    validateParams(billingIdSchema),
    async (req, res) => {
      res.json({
        success: true,
        data: await service.reconcile(
          req.auth!.userId,
          getValidatedParams<{ id: string }>(req).id,
          req.ip ?? '',
        ),
      });
    },
  );
  router.post('/billing/payos/webhook', async (req, res) => {
    await service.webhook(req.body);
    res.json({ success: true });
  });
  router.get('/billing/payos/return/:id', validateParams(billingIdSchema), (req, res) => {
    // Provider return/cancel parameters are display hints, never settlement evidence.
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.redirect(303, service.returnUrl(getValidatedParams<{ id: string }>(req).id));
  });
  return router;
}
