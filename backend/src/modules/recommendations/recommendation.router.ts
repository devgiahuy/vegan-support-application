import { Router } from 'express';
import { validateBody, validateQuery } from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { RecommendationController } from './recommendation.controller.js';
import {
  createBehaviorEventRequestSchema,
  recommendationQuerySchema,
  updatePersonalizationRequestSchema,
} from './recommendation.schemas.js';

export function createRecommendationRouter(
  controller: RecommendationController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate);
  router.get('/home', validateQuery(recommendationQuerySchema), controller.recommend);
  return router;
}

export function createBehaviorEventsRouter(
  controller: RecommendationController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate);
  router.post('/', validateBody(createBehaviorEventRequestSchema), controller.createEvent);
  return router;
}

export function createPersonalizationRouter(
  controller: RecommendationController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate);
  router.get('/personalization', controller.getPreference);
  router.put(
    '/personalization',
    validateBody(updatePersonalizationRequestSchema),
    controller.updatePreference,
  );
  router.delete('/behavior-history', controller.deleteHistory);
  return router;
}
