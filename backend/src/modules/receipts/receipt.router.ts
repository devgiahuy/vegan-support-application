import { Router } from 'express';
import { validateBody, validateParams } from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { ReceiptController } from './receipt.controller.js';
import {
  confirmReceiptJobSchema,
  createReceiptJobSchema,
  receiptCandidateParamsSchema,
  receiptJobParamsSchema,
  retryReceiptJobSchema,
  shoppingGapPreviewSchema,
  updateReceiptCandidateSchema,
} from './receipt.schemas.js';

export function createReceiptRouter(
  controller: ReceiptController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.authenticate);
  router.post('/receipt-jobs', validateBody(createReceiptJobSchema), controller.create);
  router.get('/receipt-jobs/:id', validateParams(receiptJobParamsSchema), controller.get);
  router.patch(
    '/receipt-jobs/:id/candidates/:candidateId',
    validateParams(receiptCandidateParamsSchema),
    validateBody(updateReceiptCandidateSchema),
    controller.updateCandidate,
  );
  router.post(
    '/receipt-jobs/:id/confirm',
    validateParams(receiptJobParamsSchema),
    validateBody(confirmReceiptJobSchema),
    controller.confirm,
  );
  router.post(
    '/receipt-jobs/:id/cancel',
    validateParams(receiptJobParamsSchema),
    controller.cancel,
  );
  router.post(
    '/receipt-jobs/:id/retry',
    validateParams(receiptJobParamsSchema),
    validateBody(retryReceiptJobSchema),
    controller.retry,
  );
  router.post(
    '/shopping-lists/preview',
    validateBody(shoppingGapPreviewSchema),
    controller.shoppingGap,
  );
  return router;
}
