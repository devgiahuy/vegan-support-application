import type { Request, Response } from 'express';
import { getValidatedParams, getValidatedQuery } from '../../common/validation/validate-request.js';
import type { NotificationListQuery } from './notification.schemas.js';
import type { NotificationService } from './notification.service.js';

export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  list = async (request: Request, response: Response): Promise<void> => {
    response.setHeader('Cache-Control', 'private, no-store');
    response.json({ success: true, ...(await this.service.list(request.auth!.userId, getValidatedQuery<NotificationListQuery>(request))) });
  };
  unreadCount = async (request: Request, response: Response): Promise<void> => {
    response.setHeader('Cache-Control', 'private, no-store');
    response.json({ success: true, data: await this.service.unreadCount(request.auth!.userId) });
  };
  markRead = async (request: Request, response: Response): Promise<void> => {
    response.json({ success: true, data: await this.service.markRead(request.auth!.userId, getValidatedParams<{ id: string }>(request).id) });
  };
  markAllRead = async (request: Request, response: Response): Promise<void> => {
    response.json({ success: true, data: await this.service.markAllRead(request.auth!.userId) });
  };
}
