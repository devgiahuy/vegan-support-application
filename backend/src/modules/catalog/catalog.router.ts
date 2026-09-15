import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../../common/auth/authorization.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { CatalogController } from './catalog.controller.js';
import {
  adminCategoryQuerySchema,
  adminIngredientQuerySchema,
  aliasParamsSchema,
  archiveCategoryQuerySchema,
  createCategoryRequestSchema,
  createIngredientAliasRequestSchema,
  createIngredientRequestSchema,
  idParamsSchema,
  publicCategoryQuerySchema,
  publicIngredientQuerySchema,
  resolveIngredientQuerySchema,
  updateCategoryRequestSchema,
  updateIngredientRequestSchema,
} from './catalog.schemas.js';

export function createCategoryRouter(controller: CatalogController): Router {
  const router = Router();
  router.get('/', validateQuery(publicCategoryQuerySchema), controller.listPublicCategories);
  return router;
}

export function createIngredientRouter(controller: CatalogController): Router {
  const router = Router();
  router.get('/', validateQuery(publicIngredientQuerySchema), controller.listPublicIngredients);
  router.get('/resolve', validateQuery(resolveIngredientQuerySchema), controller.resolveIngredient);
  return router;
}

export function createCatalogAdminRouter(
  controller: CatalogController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate, requireRole(Role.ADMIN));

  router.get(
    '/categories',
    validateQuery(adminCategoryQuerySchema),
    controller.listAdminCategories,
  );
  router.post('/categories', validateBody(createCategoryRequestSchema), controller.createCategory);
  router.patch(
    '/categories/:id',
    validateParams(idParamsSchema),
    validateBody(updateCategoryRequestSchema),
    controller.updateCategory,
  );
  router.delete(
    '/categories/:id',
    validateParams(idParamsSchema),
    validateQuery(archiveCategoryQuerySchema),
    controller.archiveCategory,
  );

  router.get(
    '/ingredients',
    validateQuery(adminIngredientQuerySchema),
    controller.listAdminIngredients,
  );
  router.post(
    '/ingredients',
    validateBody(createIngredientRequestSchema),
    controller.createIngredient,
  );
  router.patch(
    '/ingredients/:id',
    validateParams(idParamsSchema),
    validateBody(updateIngredientRequestSchema),
    controller.updateIngredient,
  );
  router.delete('/ingredients/:id', validateParams(idParamsSchema), controller.archiveIngredient);
  router.post(
    '/ingredients/:id/aliases',
    validateParams(idParamsSchema),
    validateBody(createIngredientAliasRequestSchema),
    controller.addIngredientAlias,
  );
  router.delete(
    '/ingredients/:id/aliases/:aliasId',
    validateParams(aliasParamsSchema),
    controller.deleteIngredientAlias,
  );
  return router;
}
