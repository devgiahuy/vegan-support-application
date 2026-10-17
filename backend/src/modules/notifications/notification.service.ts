import type { Notification, Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { notificationItemSchema } from './notification.schemas.js';
import type { NotificationListQuery } from './notification.schemas.js';

function output(row: Notification) {
  // Fail closed if any producer ever writes an unreviewed type or payload key.
  return notificationItemSchema.parse({
    id: row.id,
    type: row.type,
    title: row.title,
    summary: row.summary,
    link: row.link,
    payloadVersion: row.payloadVersion,
    payload: row.payload,
    read: row.readAt !== null,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  });
}

export class NotificationService {
  constructor(private readonly prisma: PrismaClient) {}

  private async databaseNow(): Promise<Date> {
    const result = await this.prisma.$runCommandRaw({ hello: 1 });
    const localTime = result.localTime;
    if (
      !localTime ||
      typeof localTime !== 'object' ||
      Array.isArray(localTime) ||
      !('$date' in localTime) ||
      typeof localTime.$date !== 'string'
    )
      throw new Error('MongoDB did not return localTime');
    return new Date(localTime.$date);
  }

  async list(ownerId: string, query: NotificationListQuery) {
    const now = await this.databaseNow();
    const where: Prisma.NotificationWhereInput = {
      ownerId,
      expiresAt: { gt: now },
      ...(query.unreadOnly === 'true' ? { readAt: null } : {}),
    };
    const [total, rows] = await this.prisma.$transaction(async (transaction) =>
      Promise.all([
        transaction.notification.count({ where }),
        transaction.notification.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
      ]),
    );
    return {
      data: rows.map(output),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async unreadCount(ownerId: string) {
    return {
      count: await this.prisma.notification.count({
        where: { ownerId, readAt: null, expiresAt: { gt: await this.databaseNow() } },
      }),
    };
  }

  async markRead(ownerId: string, id: string) {
    const now = await this.databaseNow();
    const updated = await this.prisma.notification.updateMany({
      where: { id, ownerId, readAt: null, expiresAt: { gt: now } },
      data: { readAt: now },
    });
    if (updated.count === 0) {
      const existing = await this.prisma.notification.findFirst({
        where: { id, ownerId, expiresAt: { gt: now } },
        select: { id: true },
      });
      if (!existing)
        throw new AppError({
          statusCode: 404,
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Không tìm thấy thông báo',
        });
    }
    return { id, read: true as const };
  }

  async markAllRead(ownerId: string) {
    const now = await this.databaseNow();
    const result = await this.prisma.notification.updateMany({
      where: { ownerId, readAt: null, expiresAt: { gt: now }, createdAt: { lte: now } },
      data: { readAt: now },
    });
    return { updatedCount: result.count };
  }
}
