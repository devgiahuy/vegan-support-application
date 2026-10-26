import { Role, type PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../../common/auth/authorization.js';
import {
  getValidatedBody,
  getValidatedParams,
  validateBody,
  validateParams,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import { idParamsSchema } from './catalog.schemas.js';
import {
  allergenCatalogResponseSchema,
  compositionInputSchema,
  compositionResponseSchema,
  compositionSourcesResponseSchema,
  type CompositionInput,
} from './composition.schemas.js';
import { CompositionService } from './composition.service.js';

export function createCompositionRouter(
  prisma: PrismaClient,
  authentication: AuthenticationMiddleware,
) {
  const router = Router();
  const service = new CompositionService(prisma);
  router.get('/allergens', async (_request, response) => {
    response.json(
      allergenCatalogResponseSchema.parse({
        success: true,
        data: await service.allergens(),
        meta: null,
      }),
    );
  });
  router.get(
    '/admin/ingredient-composition-sources',
    authentication.authenticate,
    requireRole(Role.ADMIN),
    async (_request, response) => {
      response.json(
        compositionSourcesResponseSchema.parse({
          success: true,
          data: await service.sources(),
          meta: null,
        }),
      );
    },
  );
  router.get(
    '/admin/ingredients/:id/composition',
    authentication.authenticate,
    requireRole(Role.ADMIN),
    validateParams(idParamsSchema),
    async (request, response) => {
      const { id } = getValidatedParams<{ id: string }>(request);
      response.json(
        compositionResponseSchema.parse({ success: true, data: await service.get(id), meta: null }),
      );
    },
  );
  router.put(
    '/admin/ingredients/:id/composition',
    authentication.authenticate,
    requireRole(Role.ADMIN),
    validateParams(idParamsSchema),
    validateBody(compositionInputSchema),
    async (request, response) => {
      const { id } = getValidatedParams<{ id: string }>(request);
      const data = await service.save(
        id,
        request.auth!.userId,
        getValidatedBody<CompositionInput>(request),
      );
      response.json(compositionResponseSchema.parse({ success: true, data, meta: null }));
    },
  );
  return router;
}
