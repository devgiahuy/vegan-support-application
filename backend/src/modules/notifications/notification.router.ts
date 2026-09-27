import { Router } from 'express';
import { validateParams, validateQuery } from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import type { NotificationController } from './notification.controller.js';
import { notificationIdParamsSchema, notificationListQuerySchema } from './notification.schemas.js';

export function createNotificationRouter(controller: NotificationController, authentication: AuthenticationMiddleware): Router {
  const router = Router();
  router.use(authentication.authenticate);
  router.get('/', validateQuery(notificationListQuerySchema), controller.list);
  router.get('/unread-count', controller.unreadCount);
  router.patch('/read-all', controller.markAllRead);
  router.patch('/:id/read', validateParams(notificationIdParamsSchema), controller.markRead);
  return router;
}
