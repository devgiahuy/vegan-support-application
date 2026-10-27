import {
  EntitlementFeature,
  UsageReservationStatus,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import { lockDocument } from '../../database/locking.js';
import { subscriptionPeriodDays } from '../billing/billing.catalog.js';

type ConsumableFeature = 'CHAT' | 'FRIDGE' | 'RECEIPT';
type Account = Awaited<ReturnType<Prisma.TransactionClient['entitlementAccount']['create']>>;
const fields = {
  CHAT: 'chatCredits',
  FRIDGE: 'fridgeCredits',
  RECEIPT: 'receiptCredits',
  PANTRY: 'pantrySlots',
} as const;
const periodFields = {
  CHAT: 'periodChatCredits',
  FRIDGE: 'periodFridgeCredits',
  RECEIPT: 'periodReceiptCredits',
} as const;
const day = 86_400_000;

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
    const account = await this.refreshPeriod(tx, ownerId);
    // Current-period subscription credits expire first, so they are spent before permanent ones.
    const periodKey = account.periodKey;
    const fromPeriod =
      periodKey !== null &&
      (
        await tx.entitlementAccount.updateMany({
          where: { ownerId, periodKey, [periodFields[feature]]: { gte: 1 } },
          data: { [periodFields[feature]]: { decrement: 1 } },
        })
      ).count > 0;
    const field = fields[feature];
    const updated = fromPeriod
      ? { count: 1 }
      : await tx.entitlementAccount.updateMany({
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
    const source = fromPeriod
      ? { source: 'SUBSCRIPTION', periodKey }
      : { source: 'CREDITS', periodKey: null };
    await tx.usageReservation.upsert({
      where: { resourceKey },
      create: { ownerId, feature, resourceKey, leaseUntil: until, ...source },
      update: { status: 'HELD', leaseUntil: until, generation, ...source },
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
    let refunded = !success;
    if (!success) {
      const feature = reservation.feature as ConsumableFeature;
      if (reservation.source === 'SUBSCRIPTION') {
        // A credit from an elapsed period is not returned: that period's credits already expired.
        refunded =
          (
            await tx.entitlementAccount.updateMany({
              where: { ownerId: reservation.ownerId, periodKey: reservation.periodKey },
              data: { [periodFields[feature]]: { increment: 1 } },
            })
          ).count > 0;
      } else
        await tx.entitlementAccount.update({
          where: { ownerId: reservation.ownerId },
          data: { [fields[feature]]: { increment: 1 } },
        });
    }
    await tx.entitlementLedger.create({
      data: {
        ownerId: reservation.ownerId,
        feature: reservation.feature,
        delta: refunded ? 1 : 0,
        operationKey:
          (success ? 'spend:' : 'release:') + resourceKey + ':' + reservation.generation,
        reason: success
          ? 'USAGE_COMPLETED'
          : refunded
            ? 'USAGE_RELEASED'
            : 'USAGE_RELEASED_PERIOD_EXPIRED',
      },
    });
  }

  async grant(
    tx: Prisma.TransactionClient,
    ownerId: string,
    orderId: string,
    benefits: {
      productId?: string;
      chatCredits: number;
      fridgeCredits: number;
      receiptCredits: number;
      pantrySlots: number;
      durationMonths?: number | null;
    },
  ): Promise<void> {
    await lockDocument(tx, 'user', { id: ownerId });
    await this.account(tx, ownerId);
    if (benefits.durationMonths) {
      await this.subscribe(tx, ownerId, orderId, {
        ...benefits,
        durationMonths: benefits.durationMonths,
      });
      return;
    }
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

  private async subscribe(
    tx: Prisma.TransactionClient,
    ownerId: string,
    orderId: string,
    benefits: {
      productId?: string;
      chatCredits: number;
      fridgeCredits: number;
      receiptCredits: number;
      pantrySlots: number;
      durationMonths: number;
    },
  ): Promise<void> {
    if (await tx.entitlementSubscription.findUnique({ where: { orderId } })) return;
    const now = new Date();
    const latest = await tx.entitlementSubscription.findFirst({
      where: { ownerId, endsAt: { gt: now } },
      orderBy: { endsAt: 'desc' },
    });
    // A purchase while active is appended after the current end date.
    const startsAt = latest ? latest.endsAt : now;
    const periodDays = subscriptionPeriodDays;
    await tx.entitlementSubscription.create({
      data: {
        ownerId,
        orderId,
        productId: benefits.productId ?? '',
        periodDays,
        periodCount: benefits.durationMonths,
        chatCredits: benefits.chatCredits,
        fridgeCredits: benefits.fridgeCredits,
        receiptCredits: benefits.receiptCredits,
        pantrySlots: benefits.pantrySlots,
        startsAt,
        endsAt: new Date(startsAt.getTime() + benefits.durationMonths * periodDays * day),
      },
    });
    await this.refreshPeriod(tx, ownerId, now);
  }

  /**
   * Moves the account to the subscription period containing `now`. Leftover credits of an
   * elapsed period expire; the new period receives the subscription's per-period credits once.
   * Callers must hold the owner lock.
   */
  async refreshPeriod(
    tx: Prisma.TransactionClient,
    ownerId: string,
    now = new Date(),
  ): Promise<Account> {
    const account = await this.account(tx, ownerId);
    const active = await tx.entitlementSubscription.findFirst({
      where: { ownerId, startsAt: { lte: now }, endsAt: { gt: now } },
      orderBy: { startsAt: 'asc' },
    });
    let periodKey: string | null = null;
    let periodEndsAt: Date | null = null;
    if (active) {
      const length = active.periodDays * day;
      const index = Math.floor((now.getTime() - active.startsAt.getTime()) / length);
      periodKey = active.id + ':' + index;
      periodEndsAt = new Date(
        Math.min(active.startsAt.getTime() + (index + 1) * length, active.endsAt.getTime()),
      );
    }
    if ((account.periodKey ?? null) === periodKey) return account;
    for (const feature of ['CHAT', 'FRIDGE', 'RECEIPT'] as const) {
      const leftover = account.periodKey ? (account[periodFields[feature]] ?? 0) : 0;
      if (leftover > 0)
        await this.ledgerOnce(tx, {
          ownerId,
          feature,
          delta: -leftover,
          operationKey: 'period-expire:' + account.periodKey + ':' + feature,
          reason: 'SUBSCRIPTION_PERIOD_EXPIRED',
        });
      const granted = active ? active[fields[feature]] : 0;
      if (granted > 0)
        await this.ledgerOnce(tx, {
          ownerId,
          feature,
          delta: granted,
          operationKey: 'period:' + periodKey + ':' + feature,
          reason: 'SUBSCRIPTION_PERIOD_GRANT',
        });
    }
    return tx.entitlementAccount.update({
      where: { ownerId },
      data: {
        periodKey,
        periodEndsAt,
        periodChatCredits: active?.chatCredits ?? null,
        periodFridgeCredits: active?.fridgeCredits ?? null,
        periodReceiptCredits: active?.receiptCredits ?? null,
        periodPantrySlots: active?.pantrySlots ?? null,
      },
    });
  }

  private async ledgerOnce(
    tx: Prisma.TransactionClient,
    data: {
      ownerId: string;
      feature: EntitlementFeature;
      delta: number;
      operationKey: string;
      reason: string;
    },
  ): Promise<void> {
    if (await tx.entitlementLedger.findUnique({ where: { operationKey: data.operationKey } }))
      return;
    await tx.entitlementLedger.create({ data });
  }

  private pantryLimit(account: Account): number {
    return (
      this.config.billing.pantryBaseLimit + account.pantrySlots + (account.periodPantrySlots ?? 0)
    );
  }

  async assertPantryCapacity(tx: Prisma.TransactionClient, ownerId: string): Promise<void> {
    if (!this.config.billing.enabled) return;
    await lockDocument(tx, 'user', { id: ownerId });
    const account = await this.refreshPeriod(tx, ownerId);
    const used = await tx.pantryItem.count({ where: { ownerId, deletedAt: null } });
    const limit = this.pantryLimit(account);
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
    return this.prisma.$transaction(async (tx) => {
      await lockDocument(tx, 'user', { id: ownerId });
      const account = await this.refreshPeriod(tx, ownerId);
      return account.chatCredits + (account.periodChatCredits ?? 0);
    });
  }

  async overview(ownerId: string) {
    await this.recover(new Date(), ownerId);
    return this.prisma.$transaction(async (tx) => {
      await lockDocument(tx, 'user', { id: ownerId });
      const account = await this.refreshPeriod(tx, ownerId);
      const subscriptions = await tx.entitlementSubscription.findMany({
        where: { ownerId, endsAt: { gt: new Date() } },
        orderBy: { startsAt: 'asc' },
      });
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
      const pantryLimit = this.config.billing.enabled ? this.pantryLimit(account) : null;
      const current = subscriptions[0];
      return {
        enabled: this.config.billing.enabled,
        provider: this.config.billing.provider,
        simulated: false,
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
        subscription:
          current && account.periodKey
            ? {
                productId: current.productId,
                startsAt: current.startsAt.toISOString(),
                endsAt: subscriptions[subscriptions.length - 1]!.endsAt.toISOString(),
                periodEndsAt: account.periodEndsAt!.toISOString(),
                periodDays: current.periodDays,
                chatCredits: account.periodChatCredits ?? 0,
                fridgeCredits: account.periodFridgeCredits ?? 0,
                receiptCredits: account.periodReceiptCredits ?? 0,
                pantrySlots: account.periodPantrySlots ?? 0,
                chatPerPeriod: current.chatCredits,
                fridgePerPeriod: current.fridgeCredits,
                receiptPerPeriod: current.receiptCredits,
              }
            : null,
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
