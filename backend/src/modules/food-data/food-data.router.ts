import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../../common/auth/authorization.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { FoodDataController } from './food-data.controller.js';
import {
  adminFoodDataRecordQuerySchema,
  commitFoodDataImportRequestSchema,
  createFoodDataRecordRequestSchema,
  foodDataIdParamsSchema,
  foodDataReadQuerySchema,
  foodDataRecordKindQuerySchema,
  ingredientFoodDataParamsSchema,
  ingredientNutrientQuerySchema,
  previewFoodDataImportRequestSchema,
  replaceFoodDataRecordRequestSchema,
} from './food-data.schemas.js';

export function createFoodDataRouter(controller: FoodDataController): Router {
  const router = Router();
  router.get(
    '/ingredients/:ingredientId/nutrients',
    validateParams(ingredientFoodDataParamsSchema),
    validateQuery(ingredientNutrientQuerySchema),
    controller.getIngredientNutrients,
  );
  router.get(
    '/reference-intakes',
    validateQuery(foodDataReadQuerySchema),
    controller.listReferenceIntakes,
  );
  router.get(
    '/ingredient-guidelines',
    validateQuery(foodDataReadQuerySchema),
    controller.listGuidelines,
  );
  router.get(
    '/cooking-methods',
    validateQuery(foodDataReadQuerySchema),
    controller.listCookingMethods,
  );
  router.get(
    '/interaction-rules',
    validateQuery(foodDataReadQuerySchema),
    controller.listInteractionRules,
  );
  return router;
}

export function createFoodDataAdminRouter(
  controller: FoodDataController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate, requireRole(Role.ADMIN));
  router.get(
    '/food-data/records',
    validateQuery(adminFoodDataRecordQuerySchema),
    controller.listAdminRecords,
  );
  router.post(
    '/food-data/records',
    validateBody(createFoodDataRecordRequestSchema),
    controller.createRecord,
  );
  router.put(
    '/food-data/records/:id',
    validateParams(foodDataIdParamsSchema),
    validateBody(replaceFoodDataRecordRequestSchema),
    controller.replaceRecord,
  );
  router.delete(
    '/food-data/records/:id',
    validateParams(foodDataIdParamsSchema),
    validateQuery(foodDataRecordKindQuerySchema),
    controller.archiveRecord,
  );
  router.post(
    '/food-data/imports/preview',
    validateBody(previewFoodDataImportRequestSchema),
    controller.previewImport,
  );
  router.post(
    '/food-data/imports',
    validateBody(commitFoodDataImportRequestSchema),
    controller.commitImport,
  );
  return router;
}
