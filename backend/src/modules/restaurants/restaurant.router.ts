import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../../common/auth/authorization.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { RestaurantController } from './restaurant.controller.js';
import {
  adminEditSchema,
  adminListQuerySchema,
  geocodeQuerySchema,
  internalRestaurantIdParamsSchema,
  mineListQuerySchema,
  nearbyQuerySchema,
  restaurantIdParamsSchema,
  submitRestaurantSchema,
  reviewSchema,
  searchQuerySchema,
} from './restaurant.schemas.js';

export function createRestaurantRouter(
  controller: RestaurantController,
  auth: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.get(
    '/nearby',
    auth.optionalAuthenticate,
    validateQuery(nearbyQuerySchema),
    controller.nearby,
  );
  router.get(
    '/search',
    auth.optionalAuthenticate,
    validateQuery(searchQuerySchema),
    controller.search,
  );
  router.get('/mine', auth.authenticate, validateQuery(mineListQuerySchema), controller.mine);
  router.post(
    '/',
    auth.authenticate,
    requireRole(Role.MEMBER, Role.CONTRIBUTOR, Role.ADMIN),
    validateBody(submitRestaurantSchema),
    controller.submit,
  );
  router.get(
    '/:id',
    auth.optionalAuthenticate,
    validateParams(restaurantIdParamsSchema),
    controller.get,
  );
  return router;
}

export function createRestaurantAdminRouter(
  controller: RestaurantController,
  auth: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.get(
    '/restaurants',
    auth.authenticate,
    requireRole(Role.ADMIN),
    validateQuery(adminListQuerySchema),
    controller.adminList,
  );
  router.get(
    '/restaurants/:id/history',
    auth.authenticate,
    requireRole(Role.ADMIN),
    validateParams(internalRestaurantIdParamsSchema),
    controller.history,
  );
  router.patch(
    '/restaurants/:id/review',
    auth.authenticate,
    requireRole(Role.ADMIN),
    validateParams(internalRestaurantIdParamsSchema),
    validateBody(reviewSchema),
    controller.review,
  );
  router.patch(
    '/restaurants/:id',
    auth.authenticate,
    requireRole(Role.ADMIN),
    validateParams(internalRestaurantIdParamsSchema),
    validateBody(adminEditSchema),
    controller.adminEdit,
  );
  return router;
}

export function createLocationRouter(
  controller: RestaurantController,
  auth: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.get(
    '/geocode',
    auth.optionalAuthenticate,
    validateQuery(geocodeQuerySchema),
    controller.geocode,
  );
  return router;
}
