import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../../common/auth/authorization.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { StorageController } from './storage.controller.js';
import {
  assetParamsSchema,
  commitReservationRequestSchema,
  createReservationRequestSchema,
  createStorageAdjustmentRequestSchema,
  deleteAssetRequestSchema,
  reservationParamsSchema,
  storageAccountListQuerySchema,
  storageAccountParamsSchema,
  storageAdjustmentListQuerySchema,
  storagePolicyListQuerySchema,
  storagePolicyParamsSchema,
  updateStoragePolicyRequestSchema,
} from './storage.schemas.js';

export function createStorageRouter(
  controller: StorageController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.get('/me', authentication.authenticate, controller.getMyUsage);
  router.delete(
    '/assets/:id',
    authentication.authenticate,
    validateParams(assetParamsSchema),
    validateBody(deleteAssetRequestSchema),
    controller.deleteAsset,
  );
  return router;
}

export function createStorageUploadsRouter(
  controller: StorageController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.post(
    '/reservations',
    authentication.authenticate,
    validateBody(createReservationRequestSchema),
    controller.createReservation,
  );
  router.post(
    '/reservations/:id/commit',
    authentication.authenticate,
    validateParams(reservationParamsSchema),
    validateBody(commitReservationRequestSchema),
    controller.commitReservation,
  );
  router.delete(
    '/reservations/:id',
    authentication.authenticate,
    validateParams(reservationParamsSchema),
    controller.releaseReservation,
  );
  return router;
}

export function createStorageAdminRouter(
  controller: StorageController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate, requireRole(Role.ADMIN));
  router.get('/storage/accounts', validateQuery(storageAccountListQuerySchema), controller.listAccounts);
  router.get('/storage/policies', validateQuery(storagePolicyListQuerySchema), controller.listPolicies);
  router.patch(
    '/storage/policies/:id',
    validateParams(storagePolicyParamsSchema),
    validateBody(updateStoragePolicyRequestSchema),
    controller.updatePolicy,
  );
  router.post(
    '/storage/accounts/:userId/adjustments',
    validateParams(storageAccountParamsSchema),
    validateBody(createStorageAdjustmentRequestSchema),
    controller.adjustAccount,
  );
  router.get(
    '/storage/adjustments',
    validateQuery(storageAdjustmentListQuerySchema),
    controller.listAdjustments,
  );
  return router;
}
