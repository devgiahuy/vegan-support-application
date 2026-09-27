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
    const rows = await this.prisma.$queryRaw<{ now: Date }[]>`SELECT CURRENT_TIMESTAMP AS now`;
    return rows[0]!.now;
  }

  async list(ownerId: string, query: NotificationListQuery) {
    const now = await this.databaseNow();
    const where: Prisma.NotificationWhereInput = {
      ownerId,
      expiresAt: { gt: now },
      ...(query.unreadOnly === 'true' ? { readAt: null } : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    return {
      data: rows.map(output),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async unreadCount(ownerId: string) {
    return { count: await this.prisma.notification.count({ where: { ownerId, readAt: null, expiresAt: { gt: await this.databaseNow() } } }) };
  }

  async markRead(ownerId: string, id: string) {
    const now = await this.databaseNow();
    const updated = await this.prisma.notification.updateMany({
      where: { id, ownerId, readAt: null, expiresAt: { gt: now } },
      data: { readAt: now },
    });
    if (updated.count === 0) {
      const existing = await this.prisma.notification.findFirst({ where: { id, ownerId, expiresAt: { gt: now } }, select: { id: true } });
      if (!existing) throw new AppError({ statusCode: 404, code: 'NOTIFICATION_NOT_FOUND', message: 'Không tìm thấy thông báo' });
    }
    return { id, read: true as const };
  }

  async markAllRead(ownerId: string) {
    // One UPDATE statement takes one database snapshot. A notification committed
    // after that snapshot remains unread, even when a request races this call.
    // Use the database clock for both predicates and the read timestamp. The
    // app and database clocks can differ by a few milliseconds in development.
    const updatedCount = await this.prisma.$executeRaw`
      UPDATE notifications SET read_at = CURRENT_TIMESTAMP
      WHERE owner_id = ${ownerId}::uuid AND read_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP AND created_at <= CURRENT_TIMESTAMP
    `;
    return { updatedCount };
  }
}
