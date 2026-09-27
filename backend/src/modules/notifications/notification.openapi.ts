import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { z } from '../../common/validation/zod.js';
import {
  markAllReadEnvelopeSchema, markReadEnvelopeSchema, notificationIdParamsSchema,
  notificationListEnvelopeSchema, notificationListQuerySchema, unreadCountEnvelopeSchema,
} from './notification.schemas.js';

const security = [{ bearerAuth: [] }, { cookieAuth: [] }];
const json = (schema: z.ZodTypeAny) => ({ 'application/json': { schema } });

export function registerNotificationOpenApi(registry: OpenAPIRegistry, errorSchema: z.ZodTypeAny): void {
  const list = registry.register('NotificationListResponse', notificationListEnvelopeSchema);
  const count = registry.register('NotificationUnreadCountResponse', unreadCountEnvelopeSchema);
  const one = registry.register('NotificationReadResponse', markReadEnvelopeSchema);
  const all = registry.register('NotificationReadAllResponse', markAllReadEnvelopeSchema);
  registry.registerPath({ method: 'get', path: '/api/v1/notifications', tags: ['Notifications'], operationId: 'listNotifications', summary: 'List own unexpired notifications, newest first', security, request: { query: notificationListQuerySchema }, responses: { 200: { description: 'Owner-scoped page', content: json(list) }, 401: { description: 'Authentication required', content: json(errorSchema) }, 422: { description: 'Invalid pagination', content: json(errorSchema) } } });
  registry.registerPath({ method: 'get', path: '/api/v1/notifications/unread-count', tags: ['Notifications'], operationId: 'countUnreadNotifications', summary: 'Count own unexpired unread notifications', security, responses: { 200: { description: 'Unread count', content: json(count) }, 401: { description: 'Authentication required', content: json(errorSchema) } } });
  registry.registerPath({ method: 'patch', path: '/api/v1/notifications/read-all', tags: ['Notifications'], operationId: 'markAllNotificationsRead', summary: 'Mark visible own unread notifications read atomically', security, responses: { 200: { description: 'Number newly marked read', content: json(all) }, 401: { description: 'Authentication required', content: json(errorSchema) } } });
  registry.registerPath({ method: 'patch', path: '/api/v1/notifications/{id}/read', tags: ['Notifications'], operationId: 'markNotificationRead', summary: 'Idempotently mark one owned notification read', security, request: { params: notificationIdParamsSchema }, responses: { 200: { description: 'Notification is read', content: json(one) }, 401: { description: 'Authentication required', content: json(errorSchema) }, 404: { description: 'NOTIFICATION_NOT_FOUND, including another owner or expired row', content: json(errorSchema) }, 422: { description: 'Invalid ID', content: json(errorSchema) } } });
}
