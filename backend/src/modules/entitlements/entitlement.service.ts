import {
  EntitlementFeature,
  UsageReservationStatus,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import { lockDocument } from '../../database/locking.js';

type ConsumableFeature = 'CHAT' | 'FRIDGE' | 'RECEIPT';
const fields = {
  CHAT: 'chatCredits',
  FRIDGE: 'fridgeCredits',
  RECEIPT: 'receiptCredits',
  PANTRY: 'pantrySlots',
} as const;

export class EntitlementService {
  constructor(
    private readonly prisma: PrismaClient,
    readonly config: AppConfig,
  ) {}

  async account(tx: Prisma.TransactionClient, ownerId: string) {
    const existing = await tx.entitlementAccount.findUnique({ where: { ownerId } });
    if (existing) return existing;
    const account = await tx.entitlementAccount.create({
      data: {
        ownerId,
        fridgeCredits: this.config.billing.fridgeTrialJobs,
        receiptCredits: this.config.billing.receiptTrialJobs,
      },
    });
    for (const feature of ['FRIDGE', 'RECEIPT'] as const) {
      const delta = account[fields[feature]];
      if (delta)
        await tx.entitlementLedger.create({
          data: {
            ownerId,
            feature,
            delta,
            operationKey: 'trial:' + ownerId + ':' + feature,
            reason: 'TRIAL_GRANT',
          },
        });
    }
    return account;
  }

  async reserve(
    tx: Prisma.TransactionClient,
    ownerId: string,
    feature: ConsumableFeature,
    resourceKey: string,
    leaseUntil?: Date,
  ): Promise<void> {
    if (!this.config.billing.enabled) return;
    await lockDocument(tx, 'user', { id: ownerId });
    const existing = await tx.usageReservation.findUnique({ where: { resourceKey } });
    if (existing && (existing.ownerId !== ownerId || existing.feature !== feature))
      throw new Error('USAGE_IDENTITY_MISMATCH');
    if (existing && existing.status !== UsageReservationStatus.RELEASED) return;
    await this.account(tx, ownerId);
    const field = fields[feature];
    const updated = await tx.entitlementAccount.updateMany({
      where: { ownerId, [field]: { gte: 1 } },
      data: { [field]: { decrement: 1 } },
    });
    if (!updated.count)
      throw new AppError({
        statusCode: 429,
        code: 'ENTITLEMENT_QUOTA_EXCEEDED',
        message: 'Bạn đã hết lượt sử dụng. Mua thêm gói để tiếp tục.',
        fields: { feature: [feature], cta: ['BUY_PACKAGE'] },
      });
    const until = leaseUntil ?? new Date(Date.now() + this.config.billing.usageLeaseSeconds * 1000);
    const generation = (existing?.generation ?? 0) + 1;
    await tx.usageReservation.upsert({
      where: { resourceKey },
      create: { ownerId, feature, resourceKey, leaseUntil: until },
      update: { status: 'HELD', leaseUntil: until, generation },
    });
    await tx.entitlementLedger.create({
      data: {
        ownerId,
        feature,
        delta: -1,
        operationKey: 'reserve:' + resourceKey + ':' + generation,
        reason: 'USAGE_RESERVED',
      },
    });
  }

  async settle(tx: Prisma.TransactionClient, resourceKey: string, success: boolean): Promise<void> {
    if (!this.config.billing.enabled) return;
    const reservation = await tx.usageReservation.findUnique({ where: { resourceKey } });
    if (!reservation || reservation.status !== 'HELD') return;
    await lockDocument(tx, 'user', { id: reservation.ownerId });
    const updated = await tx.usageReservation.updateMany({
      where: { id: reservation.id, status: 'HELD', generation: reservation.generation },
      data: { status: success ? 'SPENT' : 'RELEASED' },
    });
    if (!updated.count) return;
    if (!success)
      await tx.entitlementAccount.update({
        where: { ownerId: reservation.ownerId },
        data: { [fields[reservation.feature]]: { increment: 1 } },
      });
    await tx.entitlementLedger.create({
      data: {
        ownerId: reservation.ownerId,
        feature: reservation.feature,
        delta: success ? 0 : 1,
        operationKey:
          (success ? 'spend:' : 'release:') + resourceKey + ':' + reservation.generation,
        reason: success ? 'USAGE_COMPLETED' : 'USAGE_RELEASED',
      },
    });
  }

  async grant(
    tx: Prisma.TransactionClient,
    ownerId: string,
    orderId: string,
    benefits: {
      chatCredits: number;
      fridgeCredits: number;
      receiptCredits: number;
      pantrySlots: number;
    },
  ): Promise<void> {
    await lockDocument(tx, 'user', { id: ownerId });
    await this.account(tx, ownerId);
    for (const feature of Object.values(EntitlementFeature)) {
      const delta = benefits[fields[feature]];
      if (!delta) continue;
      const operationKey = 'purchase:' + orderId + ':' + feature;
      if (await tx.entitlementLedger.findUnique({ where: { operationKey } })) continue;
      await tx.entitlementAccount.update({
        where: { ownerId },
        data: { [fields[feature]]: { increment: delta } },
      });
      await tx.entitlementLedger.create({
        data: { ownerId, feature, delta, operationKey, reason: 'PACKAGE_PURCHASE' },
      });
    }
  }

  async assertPantryCapacity(tx: Prisma.TransactionClient, ownerId: string): Promise<void> {
    if (!this.config.billing.enabled) return;
    await lockDocument(tx, 'user', { id: ownerId });
    const account = await this.account(tx, ownerId);
    const used = await tx.pantryItem.count({ where: { ownerId, deletedAt: null } });
    const limit = this.config.billing.pantryBaseLimit + account.pantrySlots;
    if (used >= limit)
      throw new AppError({
        statusCode: 409,
        code: 'PANTRY_CAPACITY_EXCEEDED',
        message: 'Tủ đồ ăn đã đầy. Xóa, gộp item hoặc mua thêm ô trước khi thêm.',
        fields: { used: [String(used)], limit: [String(limit)], cta: ['BUY_PACKAGE'] },
      });
  }

  async chatBalance(ownerId: string): Promise<number> {
    if (!this.config.billing.enabled) return 0;
    return (
      (await this.prisma.entitlementAccount.findUnique({ where: { ownerId } }))?.chatCredits ?? 0
    );
  }

  async overview(ownerId: string) {
    await this.recover(new Date(), ownerId);
    return this.prisma.$transaction(async (tx) => {
      await lockDocument(tx, 'user', { id: ownerId });
      const account = await this.account(tx, ownerId);
      const held = await tx.usageReservation.findMany({
        where: { ownerId, status: 'HELD' },
        select: { feature: true },
      });
      const pantryUsed = await tx.pantryItem.count({ where: { ownerId, deletedAt: null } });
      const ledger = await tx.entitlementLedger.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      const pantryLimit = this.config.billing.enabled
        ? this.config.billing.pantryBaseLimit + account.pantrySlots
        : null;
      return {
        enabled: this.config.billing.enabled,
        provider: this.config.billing.provider,
        simulated: this.config.billing.provider === 'sandbox',
        chatCredits: account.chatCredits,
        fridgeCredits: account.fridgeCredits,
        receiptCredits: account.receiptCredits,
        chatReserved: held.filter((r) => r.feature === 'CHAT').length,
        fridgeReserved: held.filter((r) => r.feature === 'FRIDGE').length,
        receiptReserved: held.filter((r) => r.feature === 'RECEIPT').length,
        pantryUsed,
        pantryLimit,
        pantrySlots: account.pantrySlots,
        fridgeMaxImages: this.config.vision.maxImages,
        receiptMaxImages: this.config.receipt.maxImages,
        scanMaxAttempts: this.config.billing.scanMaxAttempts,
        ledger: ledger.map((entry) => ({
          id: entry.id,
          feature: entry.feature,
          delta: entry.delta,
          reason: entry.reason,
          createdAt: entry.createdAt.toISOString(),
        })),
      };
    });
  }

  async recover(now = new Date(), ownerId?: string): Promise<number> {
    if (!this.config.billing.enabled) return 0;
    let recovered = 0;
    const staleBefore = new Date(now.getTime() - this.config.billing.usageLeaseSeconds * 1000);
    for (const feature of ['FRIDGE', 'RECEIPT'] as const) {
      const where = {
        ...(ownerId ? { ownerId } : {}),
        OR: [
          { status: 'PROCESSING' as const, processingStartedAt: { lt: staleBefore } },
          { status: 'QUEUED' as const, queuedAt: { lt: staleBefore } },
        ],
      };
      const stale =
        feature === 'FRIDGE'
          ? await this.prisma.recognitionJob.findMany({ where, take: 100 })
          : await this.prisma.receiptJob.findMany({ where, take: 100 });
      for (const job of stale) {
        recovered += await this.prisma.$transaction(async (tx) => {
          await lockDocument(tx, 'user', { id: job.ownerId });
          const args = {
            where: { id: job.id, attemptCount: job.attemptCount, ...where },
            data: {
              status: 'FAILED' as const,
              processingCompletedAt: now,
              errorCode: 'USAGE_LEASE_EXPIRED',
              errorMessage: 'Tác vụ bị gián đoạn. Có thể thử lại trong giới hạn cho phép.',
            },
          };
          const result =
            feature === 'FRIDGE'
              ? await tx.recognitionJob.updateMany(args)
              : await tx.receiptJob.updateMany(args);
          if (!result.count) return 0;
          await this.settle(tx, feature + ':' + job.id, false);
          return 1;
        });
      }
    }
    const expired = await this.prisma.usageReservation.findMany({
      where: { status: 'HELD', leaseUntil: { lt: now }, ...(ownerId ? { ownerId } : {}) },
      take: 100,
    });
    for (const row of expired) {
      recovered += await this.prisma.$transaction(async (tx) => {
        await lockDocument(tx, 'user', { id: row.ownerId });
        const current = await tx.usageReservation.findUnique({ where: { id: row.id } });
        if (
          !current ||
          current.status !== 'HELD' ||
          current.generation !== row.generation ||
          current.leaseUntil >= now
        )
          return 0;
        const resource = current.resourceKey.split(':');
        if (!resource[1]) throw new Error('INVALID_USAGE_RESOURCE');
        const resourceId = resource[1];
        if (current.feature === 'CHAT') {
          await tx.aiQuotaBucket.updateMany({
            where: { reservationKey: current.resourceKey },
            data: { reservationKey: null, reservationExpiresAt: null, paidReservation: false },
          });
          await tx.chatMessage.updateMany({
            where: { id: resourceId, processingToken: current.resourceKey, status: 'PENDING' },
            data: { status: 'FAILED', processingToken: null },
          });
        } else {
          const args = {
            where: { id: resourceId, status: { in: ['QUEUED', 'PROCESSING'] } },
            data: {
              status: 'FAILED',
              processingCompletedAt: now,
              errorCode: 'USAGE_LEASE_EXPIRED',
              errorMessage: 'Tác vụ bị gián đoạn; lượt đã được trả lại.',
            },
          } as const;
          if (current.feature === 'FRIDGE')
            await tx.recognitionJob.updateMany({
              ...args,
              where: { id: resourceId, status: { in: ['QUEUED', 'PROCESSING'] } },
            });
          else
            await tx.receiptJob.updateMany({
              ...args,
              where: { id: resourceId, status: { in: ['QUEUED', 'PROCESSING'] } },
            });
        }
        await this.settle(tx, current.resourceKey, false);
        return 1;
      });
    }
    return recovered;
  }
}
