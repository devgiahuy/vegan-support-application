import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { PantryController } from './pantry.controller.js';
import {
  adjustmentListQuerySchema,
  createAdjustmentSchema,
  createPantryItemSchema,
  deletePantryItemQuerySchema,
  expiringSoonQuerySchema,
  mergePantryItemsSchema,
  mergePreviewSchema,
  pantryItemIdParamsSchema,
  pantryListQuerySchema,
  updatePantryItemSchema,
} from './pantry.schemas.js';

export function createPantryRouter(
  controller: PantryController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.get(
    '/items',
    authentication.authenticate,
    validateQuery(pantryListQuerySchema),
    controller.list,
  );
  router.post(
    '/items',
    authentication.authenticate,
    validateBody(createPantryItemSchema),
    controller.create,
  );
  router.get(
    '/items/expiring-soon',
    authentication.authenticate,
    validateQuery(expiringSoonQuerySchema),
    controller.expiringSoon,
  );
  router.post(
    '/merge-preview',
    authentication.authenticate,
    validateBody(mergePreviewSchema),
    controller.mergePreview,
  );
  router.post(
    '/merge',
    authentication.authenticate,
    validateBody(mergePantryItemsSchema),
    controller.merge,
  );
  router.get(
    '/items/:id',
    authentication.authenticate,
    validateParams(pantryItemIdParamsSchema),
    controller.get,
  );
  router.patch(
    '/items/:id',
    authentication.authenticate,
    validateParams(pantryItemIdParamsSchema),
    validateBody(updatePantryItemSchema),
    controller.update,
  );
  router.delete(
    '/items/:id',
    authentication.authenticate,
    validateParams(pantryItemIdParamsSchema),
    validateQuery(deletePantryItemQuerySchema),
    controller.delete,
  );
  router.get(
    '/items/:id/adjustments',
    authentication.authenticate,
    validateParams(pantryItemIdParamsSchema),
    validateQuery(adjustmentListQuerySchema),
    controller.listAdjustments,
  );
  router.post(
    '/items/:id/adjustments',
    authentication.authenticate,
    validateParams(pantryItemIdParamsSchema),
    validateBody(createAdjustmentSchema),
    controller.adjust,
  );
  return router;
}
