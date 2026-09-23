import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { CustomMealController } from './custom-meal.controller.js';
import {
  attachPhotoSchema,
  createCustomMealSchema,
  customMealIdParamsSchema,
  customMealListQuerySchema,
  removePhotoParamsSchema,
  reorderPhotosSchema,
  updateCustomMealSchema,
} from './custom-meal.schemas.js';

export function createCustomMealRouter(
  controller: CustomMealController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();

  router.get(
    '/',
    authentication.authenticate,
    validateQuery(customMealListQuerySchema),
    controller.list,
  );

  router.post(
    '/',
    authentication.authenticate,
    validateBody(createCustomMealSchema),
    controller.create,
  );

  router.get(
    '/:id',
    authentication.authenticate,
    validateParams(customMealIdParamsSchema),
    controller.get,
  );

  router.patch(
    '/:id',
    authentication.authenticate,
    validateParams(customMealIdParamsSchema),
    validateBody(updateCustomMealSchema),
    controller.update,
  );

  router.delete(
    '/:id',
    authentication.authenticate,
    validateParams(customMealIdParamsSchema),
    controller.delete,
  );

  router.post(
    '/:id/photos',
    authentication.authenticate,
    validateParams(customMealIdParamsSchema),
    validateBody(attachPhotoSchema),
    controller.attachPhoto,
  );

  router.delete(
    '/:id/photos/:assetId',
    authentication.authenticate,
    validateParams(removePhotoParamsSchema),
    controller.removePhoto,
  );

  router.put(
    '/:id/photos/order',
    authentication.authenticate,
    validateParams(customMealIdParamsSchema),
    validateBody(reorderPhotosSchema),
    controller.reorderPhotos,
  );

  return router;
}
