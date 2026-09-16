import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { ChatController } from './chat.controller.js';
import {
  chatFeedbackRequestSchema,
  chatListQuerySchema,
  chatMessageListQuerySchema,
  chatMessageParamsSchema,
  chatSessionParamsSchema,
  createChatSessionRequestSchema,
  sendChatMessageRequestSchema,
} from './chat.schemas.js';

export function createChatRouter(
  controller: ChatController,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.use(authentication.optionalAuthenticate);
  router.post('/sessions', validateBody(createChatSessionRequestSchema), controller.createSession);
  router.get('/sessions', validateQuery(chatListQuerySchema), controller.listSessions);
  router.get(
    '/sessions/:id/messages',
    validateParams(chatSessionParamsSchema),
    validateQuery(chatMessageListQuerySchema),
    controller.listMessages,
  );
  router.post(
    '/sessions/:id/messages',
    validateParams(chatSessionParamsSchema),
    validateBody(sendChatMessageRequestSchema),
    controller.sendMessage,
  );
  router.post(
    '/messages/:id/feedback',
    validateParams(chatMessageParamsSchema),
    validateBody(chatFeedbackRequestSchema),
    controller.feedback,
  );
  return router;
}
