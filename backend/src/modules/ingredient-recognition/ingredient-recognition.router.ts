import { Router } from 'express';
import {
  validateBody,
  validateParams,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { IngredientRecognitionController } from './ingredient-recognition.controller.js';
import {
  confirmRecognitionJobSchema,
  createRecognitionJobSchema,
  recognitionCandidateParamsSchema,
  recognitionJobParamsSchema,
  retryRecognitionJobSchema,
  updateRecognitionCandidateSchema,
} from './ingredient-recognition.schemas.js';

export function createIngredientRecognitionRouter(
  controller: IngredientRecognitionController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.post(
    '/jobs',
    authentication.authenticate,
    validateBody(createRecognitionJobSchema),
    controller.create,
  );
  router.get(
    '/jobs/:id',
    authentication.authenticate,
    validateParams(recognitionJobParamsSchema),
    controller.get,
  );
  router.patch(
    '/jobs/:id/candidates/:candidateId',
    authentication.authenticate,
    validateParams(recognitionCandidateParamsSchema),
    validateBody(updateRecognitionCandidateSchema),
    controller.updateCandidate,
  );
  router.post(
    '/jobs/:id/confirm',
    authentication.authenticate,
    validateParams(recognitionJobParamsSchema),
    validateBody(confirmRecognitionJobSchema),
    controller.confirm,
  );
  router.post(
    '/jobs/:id/cancel',
    authentication.authenticate,
    validateParams(recognitionJobParamsSchema),
    controller.cancel,
  );
  router.post(
    '/jobs/:id/retry',
    authentication.authenticate,
    validateParams(recognitionJobParamsSchema),
    validateBody(retryRecognitionJobSchema),
    controller.retry,
  );
  return router;
}
