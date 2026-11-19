import type { PrismaClient } from '@prisma/client';
import {
  parseAuditCursor,
  type AuditPage,
  type AuditQuery,
  type AuditSource,
} from './admin-audit.schemas.js';

interface AuditRecord {
  id: string;
  createdAt: Date;
  actorId: string | null;
  source: AuditSource;
  action: string;
  targetType: string;
  targetId: string;
}

const commonFields = { id: true, createdAt: true } as const;

function compareIds(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export async function listAdminAuditLogs(db: PrismaClient, query: AuditQuery): Promise<AuditPage> {
  const cursor = query.cursor ? parseAuditCursor(query.cursor) : null;
  function before(source: AuditSource) {
    if (!cursor) return {};
    if (source !== cursor.source)
      return {
        createdAt: source > cursor.source ? { lte: cursor.createdAt } : { lt: cursor.createdAt },
      };
    return {
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ],
    };
  }

  // Bound each source before merging. Each uses the same (createdAt, id) sort and index.
  const pageArgs = {
    take: query.limit + 1,
    orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
  };
  const [moderation, flags, restaurants, billing, storage, controls] = await Promise.all([
    db.moderationAction.findMany({
      ...pageArgs,
      where: before('MODERATION'),
      select: { ...commonFields, actorId: true, decision: true, targetType: true, targetId: true },
    }),
    db.aiFlag.findMany({
      ...pageArgs,
      where: before('AI_FLAG'),
      select: { ...commonFields, postRevisionId: true },
    }),
    db.restaurantAudit.findMany({
      ...pageArgs,
      where: { ...before('RESTAURANT'), action: { in: ['APPROVED', 'REJECTED', 'EDITED'] } },
      select: { ...commonFields, actorId: true, restaurantId: true, action: true },
    }),
    db.billingProductAudit.findMany({
      ...pageArgs,
      where: before('BILLING'),
      select: { ...commonFields, actorId: true, productId: true, action: true },
    }),
    db.storageAdjustment.findMany({
      ...pageArgs,
      where: before('STORAGE'),
      select: { ...commonFields, actorId: true, userId: true },
    }),
    db.aiCapabilityControlAudit.findMany({
      ...pageArgs,
      where: before('AI_CONTROL'),
      select: { ...commonFields, actorId: true, capability: true, enabled: true },
    }),
  ]);
  const records: AuditRecord[] = [
    ...moderation.map(({ decision, ...record }) => ({
      ...record,
      source: 'MODERATION' as const,
      action: decision,
    })),
    ...flags.map(({ postRevisionId, ...record }) => ({
      ...record,
      actorId: null,
      source: 'AI_FLAG' as const,
      action: 'FLAGGED',
      targetType: 'POST_REVISION',
      targetId: postRevisionId,
    })),
    ...restaurants.map(({ restaurantId, ...record }) => ({
      ...record,
      source: 'RESTAURANT' as const,
      targetType: 'RESTAURANT',
      targetId: restaurantId,
    })),
    ...billing.map(({ productId, ...record }) => ({
      ...record,
      source: 'BILLING' as const,
      targetType: 'BILLING_PRODUCT',
      targetId: productId,
    })),
    ...storage.map(({ userId, ...record }) => ({
      ...record,
      source: 'STORAGE' as const,
      action: 'ADJUST_QUOTA',
      targetType: 'USER',
      targetId: userId,
    })),
    ...controls.map(({ capability, enabled, ...record }) => ({
      ...record,
      source: 'AI_CONTROL' as const,
      action: enabled ? 'ENABLE' : 'DISABLE',
      targetType: 'AI_CAPABILITY',
      targetId: capability,
    })),
  ];
  records.sort(
    (a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime() ||
      compareIds(a.source, b.source) ||
      compareIds(b.id, a.id),
  );

  const visible = records.slice(0, query.limit);
  const last = visible.at(-1);
  const actorIds = [...new Set(visible.flatMap(({ actorId }) => (actorId ? [actorId] : [])))];
  const names = new Map(
    actorIds.length
      ? (
          await db.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, displayName: true },
          })
        ).map(({ id, displayName }) => [id, displayName] as const)
      : [],
  );
  return {
    items: visible.map(({ createdAt, actorId, ...record }) => ({
      ...record,
      occurredAt: createdAt.toISOString(),
      actor: actorId ? { id: actorId, displayName: names.get(actorId) ?? null } : null,
    })),
    nextCursor:
      last && records.length > query.limit
        ? [last.createdAt.toISOString(), last.source, last.id].join('|')
        : null,
  };
}
