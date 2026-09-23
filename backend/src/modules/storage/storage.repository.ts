import {
  MediaAssetStatus,
  PostStatus,
  Prisma,
  StorageReservationStatus,
  type MediaKind,
  type MediaResourceType,
  type PrismaClient,
} from '@prisma/client';
import type { ProviderAssetMetadata } from './cloudinary.provider.js';
import type {
  StorageAccountListQuery,
  StorageAdjustmentListQuery,
  StoragePolicyListQuery,
  UpdateStoragePolicyInput,
} from './storage.schemas.js';

const accountInclude = {
  user: { select: { id: true, email: true, displayName: true } },
  policy: true,
} satisfies Prisma.StorageAccountInclude;

const reservationInclude = { asset: true } satisfies Prisma.StorageReservationInclude;

interface LockedAccountRow {
  userId: string;
  usedBytes: bigint;
  reservedBytes: bigint;
  quotaAdjustmentBytes: bigint;
  quotaBytes: bigint;
  warningPercent: number;
  reservationTtlSeconds: number;
}

export interface ReserveData {
  userId: string;
  idempotencyKey: string;
  requestHash: string;
  resourceType: MediaResourceType;
  kind: MediaKind;
  declaredMimeType: string;
  declaredExtension: string;
  declaredBytes: bigint;
}

export class StorageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getOrCreateAccount(userId: string) {
    return this.prisma.$transaction(async (transaction) => {
      await this.ensureAccount(transaction, userId);
      return transaction.storageAccount.findUniqueOrThrow({
        where: { userId },
        include: accountInclude,
      });
    });
  }

  async reserve(data: ReserveData) {
    return this.prisma.$transaction(async (transaction) => {
      await this.ensureAccount(transaction, data.userId);
      let account = await this.lockAccount(transaction, data.userId);
      account = await this.expireOwnedReservations(transaction, account);
      const existing = await transaction.storageReservation.findUnique({
        where: {
          userId_idempotencyKey: {
            userId: data.userId,
            idempotencyKey: data.idempotencyKey,
          },
        },
        include: reservationInclude,
      });
      if (existing) return { kind: 'existing' as const, reservation: existing, account };

      const limitBytes = account.quotaBytes + account.quotaAdjustmentBytes;
      if (account.usedBytes + account.reservedBytes + data.declaredBytes > limitBytes) {
        return { kind: 'quota' as const, account };
      }
      const expiresAt = new Date(Date.now() + account.reservationTtlSeconds * 1_000);
      const reservation = await transaction.storageReservation.create({
        data: { ...data, expiresAt },
        include: reservationInclude,
      });
      await transaction.storageAccount.update({
        where: { userId: data.userId },
        data: { reservedBytes: { increment: data.declaredBytes } },
      });
      return {
        kind: 'created' as const,
        reservation,
        account: { ...account, reservedBytes: account.reservedBytes + data.declaredBytes },
      };
    });
  }

  async commit(
    userId: string,
    reservationId: string,
    commitHash: string,
    metadata: ProviderAssetMetadata,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await this.ensureAccount(transaction, userId);
      let account = await this.lockAccount(transaction, userId);
      account = await this.expireOwnedReservations(transaction, account);
      const reservation = await transaction.storageReservation.findFirst({
        where: { id: reservationId, userId },
        include: reservationInclude,
      });
      if (!reservation) return { kind: 'not-found' as const };
      if (reservation.status === StorageReservationStatus.COMMITTED) {
        return { kind: 'committed' as const, reservation, account };
      }
      if (reservation.status === StorageReservationStatus.EXPIRED) {
        return { kind: 'expired' as const, reservation, account };
      }
      if (reservation.status !== StorageReservationStatus.RESERVED) {
        return { kind: 'conflict' as const, reservation, account };
      }
      if (reservation.expiresAt <= new Date()) {
        const expired = await this.expireReservation(transaction, reservation);
        return {
          kind: 'expired' as const,
          reservation: expired,
          account: {
            ...account,
            reservedBytes: this.subtractFloor(account.reservedBytes, reservation.declaredBytes),
          },
        };
      }

      const nextReserved = this.subtractFloor(account.reservedBytes, reservation.declaredBytes);
      const nextUsed = account.usedBytes + BigInt(metadata.bytes);
      const limitBytes = account.quotaBytes + account.quotaAdjustmentBytes;
      if (nextUsed + nextReserved > limitBytes) {
        const released = await transaction.storageReservation.update({
          where: { id: reservation.id },
          data: {
            status: StorageReservationStatus.RELEASED,
            releasedAt: new Date(),
            releaseReason: 'ACTUAL_SIZE_EXCEEDS_AVAILABLE_QUOTA',
          },
          include: reservationInclude,
        });
        await transaction.storageAccount.update({
          where: { userId },
          data: { reservedBytes: nextReserved },
        });
        return {
          kind: 'quota' as const,
          reservation: released,
          account: { ...account, reservedBytes: nextReserved },
          requestedBytes: BigInt(metadata.bytes),
        };
      }

      const now = new Date();
      const asset = await transaction.mediaAsset.create({
        data: {
          ownerId: userId,
          reservationId: reservation.id,
          resourceType: metadata.resourceType,
          kind: reservation.kind,
          publicId: metadata.publicId,
          secureUrl: metadata.secureUrl,
          mimeType: metadata.mimeType,
          extension: metadata.extension,
          bytes: metadata.bytes,
          width: metadata.width,
          height: metadata.height,
          durationSeconds: metadata.durationSeconds,
          providerVersion: metadata.version,
          providerEtag: metadata.etag,
          reconciledAt: now,
        },
      });
      const committed = await transaction.storageReservation.update({
        where: { id: reservation.id },
        data: {
          status: StorageReservationStatus.COMMITTED,
          commitHash,
          actualBytes: metadata.bytes,
          committedAt: now,
        },
        include: reservationInclude,
      });
      await transaction.storageAccount.update({
        where: { userId },
        data: { usedBytes: nextUsed, reservedBytes: nextReserved },
      });
      return {
        kind: 'created' as const,
        reservation: { ...committed, asset },
        account: { ...account, usedBytes: nextUsed, reservedBytes: nextReserved },
      };
    });
  }

  async release(userId: string, reservationId: string, reason: string) {
    return this.prisma.$transaction(async (transaction) => {
      await this.ensureAccount(transaction, userId);
      const account = await this.lockAccount(transaction, userId);
      const reservation = await transaction.storageReservation.findFirst({
        where: { id: reservationId, userId },
        include: reservationInclude,
      });
      if (!reservation) return { kind: 'not-found' as const };
      if (reservation.status !== StorageReservationStatus.RESERVED) {
        return { kind: 'existing' as const, reservation, account };
      }
      const expired = reservation.expiresAt <= new Date();
      const released = await transaction.storageReservation.update({
        where: { id: reservation.id },
        data: {
          status: expired ? StorageReservationStatus.EXPIRED : StorageReservationStatus.RELEASED,
          releasedAt: new Date(),
          releaseReason: expired ? 'RESERVATION_EXPIRED' : reason,
        },
        include: reservationInclude,
      });
      const reservedBytes = this.subtractFloor(account.reservedBytes, reservation.declaredBytes);
      await transaction.storageAccount.update({
        where: { userId },
        data: { reservedBytes },
      });
      return { kind: 'released' as const, reservation: released, account: { ...account, reservedBytes } };
    });
  }

  async findAttachableAsset(ownerId: string, assetId: string, kind: MediaKind) {
    return this.prisma.mediaAsset.findFirst({
      where: { id: assetId, ownerId, kind, status: MediaAssetStatus.ACTIVE },
    });
  }

  findOwnedReservation(userId: string, reservationId: string) {
    return this.prisma.storageReservation.findFirst({
      where: { id: reservationId, userId },
      include: reservationInclude,
    });
  }

  async prepareAssetDeletion(userId: string, assetId: string, idempotencyKey: string) {
    return this.prisma.$transaction(async (transaction) => {
      const rows = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id" FROM "media_assets" WHERE "id" = ${assetId}::uuid FOR UPDATE
      `);
      if (!rows[0]) return { kind: 'not-found' as const };
      const asset = await transaction.mediaAsset.findFirst({ where: { id: assetId, ownerId: userId } });
      if (!asset) return { kind: 'not-found' as const };
      if (asset.status === MediaAssetStatus.DELETED || asset.status === MediaAssetStatus.PROVIDER_MISSING) {
        return asset.deletionIdempotencyKey === idempotencyKey
          ? { kind: 'deleted' as const, asset }
          : { kind: 'conflict' as const, asset };
      }
      if (asset.status === MediaAssetStatus.DELETING) {
        return asset.deletionIdempotencyKey === idempotencyKey
          ? { kind: 'prepared' as const, asset }
          : { kind: 'conflict' as const, asset };
      }
      const activeReferences = await transaction.postMedia.count({
        where: { assetId, revision: { post: { status: { not: PostStatus.DELETED } } } },
      });
      if (activeReferences > 0) return { kind: 'in-use' as const, asset };
      const customMealPhotoReferences = await transaction.customMealPhoto.count({
        where: { assetId, customMeal: { deletedAt: null } },
      });
      if (customMealPhotoReferences > 0) return { kind: 'in-use' as const, asset };
      const prepared = await transaction.mediaAsset.update({
        where: { id: asset.id },
        data: { status: MediaAssetStatus.DELETING, deletionIdempotencyKey: idempotencyKey },
      });
      return { kind: 'prepared' as const, asset: prepared };
    });
  }

  async completeAssetDeletion(userId: string, assetId: string) {
    return this.prisma.$transaction(async (transaction) => {
      await this.ensureAccount(transaction, userId);
      const account = await this.lockAccount(transaction, userId);
      const asset = await transaction.mediaAsset.findFirst({ where: { id: assetId, ownerId: userId } });
      if (!asset) return null;
      if (asset.status === MediaAssetStatus.DELETED || asset.status === MediaAssetStatus.PROVIDER_MISSING) {
        return { asset, account };
      }
      const deleted = await transaction.mediaAsset.update({
        where: { id: asset.id },
        data: { status: MediaAssetStatus.DELETED, deletedAt: new Date(), deletedById: userId },
      });
      const usedBytes = this.subtractFloor(account.usedBytes, asset.bytes);
      await transaction.storageAccount.update({ where: { userId }, data: { usedBytes } });
      return { asset: deleted, account: { ...account, usedBytes } };
    });
  }

  async restoreAssetAfterDeleteFailure(userId: string, assetId: string): Promise<void> {
    await this.prisma.mediaAsset.updateMany({
      where: { id: assetId, ownerId: userId, status: MediaAssetStatus.DELETING },
      data: { status: MediaAssetStatus.ACTIVE, deletionIdempotencyKey: null },
    });
  }

  async listAccounts(query: StorageAccountListQuery) {
    const where: Prisma.StorageAccountWhereInput = {
      ...(query.q
        ? {
            user: {
              OR: [
                { email: { contains: query.q, mode: 'insensitive' as const } },
                { displayName: { contains: query.q, mode: 'insensitive' as const } },
              ],
            },
          }
        : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.storageAccount.findMany({
        where,
        include: accountInclude,
        orderBy: [{ usedBytes: 'desc' }, { userId: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.storageAccount.count({ where }),
    ]);
    const filtered =
      query.overQuota === undefined
        ? records
        : records.filter((record) => {
            const overQuota = record.usedBytes + record.reservedBytes > record.policy.quotaBytes + record.quotaAdjustmentBytes;
            return overQuota === query.overQuota;
          });
    return { records: filtered, total: query.overQuota === undefined ? total : filtered.length };
  }

  async listPolicies(query: StoragePolicyListQuery) {
    const where = query.active === undefined ? {} : { active: query.active };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.storagePolicy.findMany({
        where,
        orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.storagePolicy.count({ where }),
    ]);
    return { records, total };
  }

  findPolicy(id: string) {
    return this.prisma.storagePolicy.findUnique({ where: { id } });
  }

  async updatePolicy(id: string, actorId: string, input: UpdateStoragePolicyInput) {
    const updated = await this.prisma.storagePolicy.updateMany({
      where: { id, version: input.expectedVersion },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.quotaBytes !== undefined ? { quotaBytes: input.quotaBytes } : {}),
        ...(input.reservationTtlSeconds !== undefined
          ? { reservationTtlSeconds: input.reservationTtlSeconds }
          : {}),
        ...(input.warningPercent !== undefined ? { warningPercent: input.warningPercent } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        updatedById: actorId,
        version: { increment: 1 },
      },
    });
    return updated.count === 1 ? this.prisma.storagePolicy.findUnique({ where: { id } }) : null;
  }

  async adjustAccount(
    userId: string,
    actorId: string,
    idempotencyKey: string,
    requestHash: string,
    deltaBytes: bigint,
    reason: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await this.ensureAccount(transaction, userId);
      const account = await this.lockAccount(transaction, userId);
      const existing = await transaction.storageAdjustment.findUnique({
        where: { actorId_idempotencyKey: { actorId, idempotencyKey } },
      });
      if (existing) return { kind: 'existing' as const, adjustment: existing, account };
      const afterBytes = account.quotaAdjustmentBytes + deltaBytes;
      if (account.quotaBytes + afterBytes < 0n) return { kind: 'invalid' as const, account };
      const adjustment = await transaction.storageAdjustment.create({
        data: {
          userId,
          actorId,
          idempotencyKey,
          requestHash,
          deltaBytes,
          beforeBytes: account.quotaAdjustmentBytes,
          afterBytes,
          reason,
        },
      });
      await transaction.storageAccount.update({
        where: { userId },
        data: { quotaAdjustmentBytes: afterBytes },
      });
      return {
        kind: 'created' as const,
        adjustment,
        account: { ...account, quotaAdjustmentBytes: afterBytes },
      };
    });
  }

  async getAccountRecord(userId: string) {
    return this.prisma.storageAccount.findUnique({ where: { userId }, include: accountInclude });
  }

  async listAdjustments(query: StorageAdjustmentListQuery) {
    const where = query.userId ? { userId: query.userId } : {};
    const [records, total] = await this.prisma.$transaction([
      this.prisma.storageAdjustment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.storageAdjustment.count({ where }),
    ]);
    return { records, total };
  }

  async cleanupExpired(limit: number): Promise<{ expired: number; releasedBytes: bigint }> {
    return this.prisma.$transaction(async (transaction) => {
      const candidates = await transaction.storageReservation.findMany({
        where: { status: StorageReservationStatus.RESERVED, expiresAt: { lte: new Date() } },
        orderBy: { expiresAt: 'asc' },
        take: limit,
      });
      let releasedBytes = 0n;
      let expired = 0;
      for (const candidate of candidates) {
        await this.ensureAccount(transaction, candidate.userId);
        const account = await this.lockAccount(transaction, candidate.userId);
        const current = await transaction.storageReservation.findUnique({ where: { id: candidate.id } });
        if (!current || current.status !== StorageReservationStatus.RESERVED) continue;
        await this.expireReservation(transaction, current);
        await transaction.storageAccount.update({
          where: { userId: candidate.userId },
          data: { reservedBytes: this.subtractFloor(account.reservedBytes, current.declaredBytes) },
        });
        releasedBytes += current.declaredBytes;
        expired += 1;
      }
      return { expired, releasedBytes };
    });
  }

  async reconciliationSnapshot() {
    const [accounts, assets, reservations] = await Promise.all([
      this.prisma.storageAccount.findMany({ include: { policy: true } }),
      this.prisma.mediaAsset.findMany({
        where: { status: { in: [MediaAssetStatus.ACTIVE, MediaAssetStatus.DELETING] } },
        select: {
          id: true,
          ownerId: true,
          publicId: true,
          resourceType: true,
          bytes: true,
          mimeType: true,
          extension: true,
          backfilled: true,
        },
      }),
      this.prisma.storageReservation.findMany({
        where: { status: StorageReservationStatus.RESERVED },
        select: { id: true, userId: true, declaredBytes: true, expiresAt: true },
      }),
    ]);
    return { accounts, assets, reservations };
  }

  async applyCounterReconciliation(userId: string, usedBytes: bigint, reservedBytes: bigint) {
    return this.prisma.storageAccount.update({
      where: { userId },
      data: { usedBytes, reservedBytes },
    });
  }

  async reconcileAssetMetadata(
    assetId: string,
    metadata: ProviderAssetMetadata | null,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const rows = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id" FROM "media_assets" WHERE "id" = ${assetId}::uuid FOR UPDATE
      `);
      if (!rows[0]) return;
      const asset = await transaction.mediaAsset.findUniqueOrThrow({ where: { id: assetId } });
      await this.ensureAccount(transaction, asset.ownerId);
      const account = await this.lockAccount(transaction, asset.ownerId);
      if (!metadata) {
        if (!([MediaAssetStatus.ACTIVE, MediaAssetStatus.DELETING] as string[]).includes(asset.status)) return;
        await transaction.mediaAsset.update({
          where: { id: asset.id },
          data: {
            status: MediaAssetStatus.PROVIDER_MISSING,
            deletedAt: new Date(),
            reconciledAt: new Date(),
          },
        });
        await transaction.storageAccount.update({
          where: { userId: asset.ownerId },
          data: { usedBytes: this.subtractFloor(account.usedBytes, asset.bytes) },
        });
        return;
      }
      const usedBytes = account.usedBytes - asset.bytes + BigInt(metadata.bytes);
      await transaction.mediaAsset.update({
        where: { id: asset.id },
        data: {
          secureUrl: metadata.secureUrl,
          mimeType: metadata.mimeType,
          extension: metadata.extension,
          bytes: metadata.bytes,
          width: metadata.width,
          height: metadata.height,
          durationSeconds: metadata.durationSeconds,
          providerVersion: metadata.version,
          providerEtag: metadata.etag,
          reconciledAt: new Date(),
        },
      });
      await transaction.storageAccount.update({ where: { userId: asset.ownerId }, data: { usedBytes } });
    });
  }

  private async ensureAccount(transaction: Prisma.TransactionClient, userId: string): Promise<void> {
    const policy = await transaction.storagePolicy.findFirst({
      where: { isDefault: true, active: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!policy) throw new Error('No active default storage policy');
    await transaction.storageAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, policyId: policy.id },
    });
  }

  private async lockAccount(
    transaction: Prisma.TransactionClient,
    userId: string,
  ): Promise<LockedAccountRow> {
    const rows = await transaction.$queryRaw<LockedAccountRow[]>(Prisma.sql`
      SELECT
        sa."user_id" AS "userId",
        sa."used_bytes" AS "usedBytes",
        sa."reserved_bytes" AS "reservedBytes",
        sa."quota_adjustment_bytes" AS "quotaAdjustmentBytes",
        sp."quota_bytes" AS "quotaBytes",
        sp."warning_percent" AS "warningPercent",
        sp."reservation_ttl_seconds" AS "reservationTtlSeconds"
      FROM "storage_accounts" sa
      JOIN "storage_policies" sp ON sp."id" = sa."policy_id"
      WHERE sa."user_id" = ${userId}::uuid
      FOR UPDATE OF sa
    `);
    const account = rows[0];
    if (!account) throw new Error('Storage account was not created');
    return account;
  }

  private async expireOwnedReservations(
    transaction: Prisma.TransactionClient,
    account: LockedAccountRow,
  ): Promise<LockedAccountRow> {
    const expired = await transaction.storageReservation.findMany({
      where: {
        userId: account.userId,
        status: StorageReservationStatus.RESERVED,
        expiresAt: { lte: new Date() },
      },
    });
    if (expired.length === 0) return account;
    const released = expired.reduce((sum, item) => sum + item.declaredBytes, 0n);
    await transaction.storageReservation.updateMany({
      where: { id: { in: expired.map((item) => item.id) }, status: StorageReservationStatus.RESERVED },
      data: {
        status: StorageReservationStatus.EXPIRED,
        releasedAt: new Date(),
        releaseReason: 'RESERVATION_EXPIRED',
      },
    });
    const reservedBytes = this.subtractFloor(account.reservedBytes, released);
    await transaction.storageAccount.update({ where: { userId: account.userId }, data: { reservedBytes } });
    return { ...account, reservedBytes };
  }

  private expireReservation(
    transaction: Prisma.TransactionClient,
    reservation: { id: string },
  ) {
    return transaction.storageReservation.update({
      where: { id: reservation.id },
      data: {
        status: StorageReservationStatus.EXPIRED,
        releasedAt: new Date(),
        releaseReason: 'RESERVATION_EXPIRED',
      },
      include: reservationInclude,
    });
  }

  private subtractFloor(value: bigint, decrement: bigint): bigint {
    return value > decrement ? value - decrement : 0n;
  }
}
