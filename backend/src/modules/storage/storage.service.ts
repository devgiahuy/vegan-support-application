import { createHash } from 'node:crypto';
import {
  MediaKind,
  MediaResourceType,
  StorageReservationStatus,
  type MediaAsset,
  type StoragePolicy,
  type StorageReservation,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import type { CloudinaryMediaProvider, ProviderAssetMetadata } from './cloudinary.provider.js';
import type { StorageRepository } from './storage.repository.js';
import type {
  CommitReservationInput,
  CreateReservationInput,
  CreateStorageAdjustmentInput,
  StorageAccountListQuery,
  StorageAdjustmentListQuery,
  StoragePolicyListQuery,
  UpdateStoragePolicyInput,
} from './storage.schemas.js';

const mimeExtensions: Readonly<Record<string, readonly string[]>> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
};

type AccountLike = {
  usedBytes: bigint;
  reservedBytes: bigint;
  quotaAdjustmentBytes: bigint;
  quotaBytes: bigint;
  warningPercent: number;
};

function payloadHash(input: unknown): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

function safeNumber(value: bigint): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw new Error('Storage byte counter exceeds safe integer range');
  return result;
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}

export class StorageService {
  constructor(
    private readonly repository: StorageRepository,
    private readonly provider: CloudinaryMediaProvider,
    private readonly config: AppConfig,
  ) {}

  async getUsage(userId: string) {
    const account = await this.repository.getOrCreateAccount(userId);
    return { usage: this.usage({ ...account, quotaBytes: account.policy.quotaBytes, warningPercent: account.policy.warningPercent }), policy: this.policy(account.policy) };
  }

  async createReservation(userId: string, input: CreateReservationInput) {
    const resourceType =
      input.kind === MediaKind.VIDEO ? MediaResourceType.VIDEO : MediaResourceType.IMAGE;
    this.validateDeclaration(input, resourceType);
    const hash = payloadHash({
      kind: input.kind,
      mimeType: input.mimeType,
      extension: input.extension,
      bytes: input.bytes,
    });
    const result = await this.repository.reserve({
      userId,
      idempotencyKey: input.idempotencyKey,
      requestHash: hash,
      resourceType,
      kind: input.kind,
      declaredMimeType: input.mimeType,
      declaredExtension: input.extension,
      declaredBytes: BigInt(input.bytes),
    });
    if (result.kind === 'quota') throw this.quotaError(result.account, BigInt(input.bytes));
    if (result.kind === 'existing' && result.reservation.requestHash !== hash) {
      throw this.conflict('UPLOAD_IDEMPOTENCY_CONFLICT', 'Idempotency key đã dùng cho payload khác');
    }
    if (result.reservation.status === StorageReservationStatus.EXPIRED) {
      throw this.expiredError(result.reservation);
    }
    if (result.reservation.status !== StorageReservationStatus.RESERVED) {
      throw this.conflict('UPLOAD_RESERVATION_CONFLICT', 'Reservation không còn ở trạng thái RESERVED');
    }
    const maxBytes = this.maxBytes(resourceType);
    return {
      reservation: this.reservation(result.reservation),
      usage: this.usage(result.account),
      upload: this.provider.createUploadConfiguration(resourceType, maxBytes),
    };
  }

  async commitReservation(userId: string, reservationId: string, input: CommitReservationInput) {
    const hash = payloadHash(input);
    const existing = await this.expectedReservation(userId, reservationId);
    if (existing.status === StorageReservationStatus.COMMITTED) {
      if (existing.commitHash !== hash) {
        throw this.conflict('UPLOAD_IDEMPOTENCY_CONFLICT', 'Commit retry không khớp payload ban đầu');
      }
      const account = await this.repository.getOrCreateAccount(userId);
      return { reservation: this.reservation(existing), usage: this.usage({ ...account, quotaBytes: account.policy.quotaBytes, warningPercent: account.policy.warningPercent }) };
    }
    if (existing.status === StorageReservationStatus.EXPIRED || existing.expiresAt <= new Date()) {
      await this.repository.release(userId, reservationId, 'RESERVATION_EXPIRED');
      throw this.expiredError(existing);
    }
    if (existing.status !== StorageReservationStatus.RESERVED) {
      throw this.conflict('UPLOAD_RESERVATION_CONFLICT', 'Reservation không còn ở trạng thái RESERVED');
    }
    let metadata: ProviderAssetMetadata;
    try {
      metadata = await this.provider.verifyUpload(input, existing.resourceType);
    } catch (error) {
      if (error instanceof AppError && error.code === 'UPLOAD_PROVIDER_MISMATCH') {
        await this.repository.release(userId, reservationId, 'PROVIDER_MISMATCH');
      }
      throw error;
    }
    try {
      this.validateProviderMetadata(existing, metadata);
    } catch (error) {
      await this.repository.release(userId, reservationId, 'INVALID_PROVIDER_METADATA');
      throw error;
    }
    const result = await this.repository.commit(userId, reservationId, hash, metadata);
    if (result.kind === 'not-found') throw this.notFound();
    if (result.kind === 'expired') throw this.expiredError(result.reservation);
    if (result.kind === 'conflict') {
      throw this.conflict('UPLOAD_RESERVATION_CONFLICT', 'Reservation không thể commit');
    }
    if (result.kind === 'committed') {
      if (result.reservation.commitHash !== hash) {
        throw this.conflict('UPLOAD_IDEMPOTENCY_CONFLICT', 'Commit retry không khớp payload ban đầu');
      }
      return { reservation: this.reservation(result.reservation), usage: this.usage(result.account) };
    }
    if (result.kind === 'quota') {
      try {
        await this.provider.deleteResource(metadata.publicId, metadata.resourceType);
      } catch {
        // Reconciliation reports the provider orphan; quota remains released and uncommitted.
      }
      throw this.quotaError(result.account, result.requestedBytes);
    }
    return { reservation: this.reservation(result.reservation), usage: this.usage(result.account) };
  }

  async releaseReservation(userId: string, reservationId: string) {
    const result = await this.repository.release(userId, reservationId, 'USER_CANCELLED');
    if (result.kind === 'not-found') throw this.notFound();
    if (result.kind === 'existing' && result.reservation.status === StorageReservationStatus.COMMITTED) {
      throw this.conflict('UPLOAD_RESERVATION_CONFLICT', 'Reservation đã commit và không thể release');
    }
    return { reservation: this.reservation(result.reservation), usage: this.usage(result.account) };
  }

  async deleteAsset(userId: string, assetId: string, idempotencyKey: string) {
    const prepared = await this.repository.prepareAssetDeletion(userId, assetId, idempotencyKey);
    if (prepared.kind === 'not-found') throw this.notFound();
    if (prepared.kind === 'in-use') {
      throw this.conflict('MEDIA_ASSET_IN_USE', 'Media vẫn được nội dung chưa xóa tham chiếu');
    }
    if (prepared.kind === 'conflict') {
      throw this.conflict('MEDIA_DELETE_IDEMPOTENCY_CONFLICT', 'Asset đã được xóa bằng thao tác khác');
    }
    if (prepared.kind !== 'deleted') {
      try {
        await this.provider.deleteResource(prepared.asset.publicId, prepared.asset.resourceType);
      } catch (error) {
        await this.repository.restoreAssetAfterDeleteFailure(userId, assetId);
        throw error instanceof AppError
          ? error
          : new AppError({
              statusCode: 502,
              code: 'MEDIA_DELETE_FAILED',
              message: 'Provider chưa xác nhận xóa media',
              expose: true,
            });
      }
    }
    const completed = await this.repository.completeAssetDeletion(userId, assetId);
    if (!completed) throw this.notFound();
    return { asset: this.asset(completed.asset), usage: this.usage(completed.account) };
  }

  async listAccounts(query: StorageAccountListQuery) {
    const result = await this.repository.listAccounts(query);
    return {
      data: result.records.map((record) => this.account(record)),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  async listPolicies(query: StoragePolicyListQuery) {
    const result = await this.repository.listPolicies(query);
    return {
      data: result.records.map((record) => this.policy(record)),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  async updatePolicy(id: string, actorId: string, input: UpdateStoragePolicyInput) {
    const current = await this.repository.findPolicy(id);
    if (!current) throw this.notFound();
    if (current.isDefault && input.active === false) {
      throw this.conflict('STORAGE_POLICY_CONFLICT', 'Không thể tắt policy mặc định');
    }
    const updated = await this.repository.updatePolicy(id, actorId, input);
    if (!updated) {
      throw new AppError({
        statusCode: 409,
        code: 'STORAGE_POLICY_CONFLICT',
        message: 'Policy đã thay đổi, hãy tải lại trước khi cập nhật',
        fields: { currentVersion: [String(current.version)] },
      });
    }
    return this.policy(updated);
  }

  async adjustAccount(
    userId: string,
    actorId: string,
    input: CreateStorageAdjustmentInput,
  ) {
    const hash = payloadHash({ userId, deltaBytes: input.deltaBytes, reason: input.reason });
    const result = await this.repository.adjustAccount(
      userId,
      actorId,
      input.idempotencyKey,
      hash,
      BigInt(input.deltaBytes),
      input.reason,
    );
    if (result.kind === 'existing' && result.adjustment.requestHash !== hash) {
      throw this.conflict('STORAGE_ADJUSTMENT_IDEMPOTENCY_CONFLICT', 'Idempotency key đã dùng cho adjustment khác');
    }
    if (result.kind === 'invalid') {
      throw this.conflict('STORAGE_ADJUSTMENT_INVALID', 'Adjustment làm giới hạn tài khoản nhỏ hơn 0');
    }
    const account = await this.repository.getAccountRecord(userId);
    if (!account) throw this.notFound();
    return { adjustment: this.adjustment(result.adjustment), account: this.account(account) };
  }

  async listAdjustments(query: StorageAdjustmentListQuery) {
    const result = await this.repository.listAdjustments(query);
    return {
      data: result.records.map((record) => this.adjustment(record)),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  private async expectedReservation(userId: string, reservationId: string) {
    const reservation = await this.repository.findOwnedReservation(userId, reservationId);
    if (!reservation) throw this.notFound();
    return reservation;
  }

  private validateDeclaration(input: CreateReservationInput, resourceType: MediaResourceType): void {
    const allowedExtensions = mimeExtensions[input.mimeType];
    if (!allowedExtensions || !allowedExtensions.includes(input.extension)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_UPLOAD',
        message: 'MIME type và extension không tương thích',
      });
    }
    if (!input.mimeType.startsWith(`${resourceType.toLowerCase()}/`)) {
      throw new AppError({ statusCode: 400, code: 'INVALID_UPLOAD', message: 'Loại media không khớp MIME type' });
    }
    const maxBytes = this.maxBytes(resourceType);
    if (input.bytes > maxBytes) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_UPLOAD',
        message: 'File vượt quá giới hạn kích thước',
        fields: { maxBytes: [String(maxBytes)], declaredBytes: [String(input.bytes)] },
      });
    }
  }

  private validateProviderMetadata(
    reservation: StorageReservation,
    metadata: ProviderAssetMetadata,
  ): void {
    const extensions = mimeExtensions[reservation.declaredMimeType] ?? [];
    const extensionMatches =
      extensions.includes(metadata.extension) && extensions.includes(reservation.declaredExtension);
    const mismatches = [
      ...(metadata.resourceType !== reservation.resourceType ? ['resourceType'] : []),
      ...(metadata.mimeType !== reservation.declaredMimeType ? ['mimeType'] : []),
      ...(!extensionMatches ? ['extension'] : []),
      ...(metadata.bytes > this.maxBytes(reservation.resourceType) ? ['bytes'] : []),
    ];
    if (mismatches.length > 0) {
      throw new AppError({
        statusCode: 422,
        code: 'UPLOAD_PROVIDER_MISMATCH',
        message: 'Metadata provider không khớp khai báo reservation',
        fields: { mismatches },
      });
    }
  }

  private maxBytes(resourceType: MediaResourceType): number {
    return resourceType === MediaResourceType.IMAGE
      ? this.config.maxUploadImageBytes
      : this.config.maxUploadVideoBytes;
  }

  private usage(account: AccountLike) {
    const limit = account.quotaBytes + account.quotaAdjustmentBytes;
    const consumed = account.usedBytes + account.reservedBytes;
    return {
      usedBytes: safeNumber(account.usedBytes),
      reservedBytes: safeNumber(account.reservedBytes),
      limitBytes: safeNumber(limit > 0n ? limit : 0n),
      remainingBytes: safeNumber(limit > consumed ? limit - consumed : 0n),
      overQuota: consumed > limit,
      warningPercent: account.warningPercent,
    };
  }

  private policy(policy: StoragePolicy) {
    return {
      id: policy.id,
      code: policy.code,
      name: policy.name,
      quotaBytes: safeNumber(policy.quotaBytes),
      reservationTtlSeconds: policy.reservationTtlSeconds,
      warningPercent: policy.warningPercent,
      active: policy.active,
      isDefault: policy.isDefault,
      version: policy.version,
      updatedAt: policy.updatedAt.toISOString(),
    };
  }

  private reservation(record: StorageReservation & { asset?: MediaAsset | null }) {
    return {
      id: record.id,
      status: record.status,
      resourceType: record.resourceType,
      kind: record.kind,
      declaredMimeType: record.declaredMimeType,
      declaredExtension: record.declaredExtension,
      declaredBytes: safeNumber(record.declaredBytes),
      actualBytes: record.actualBytes === null ? null : safeNumber(record.actualBytes),
      expiresAt: record.expiresAt.toISOString(),
      committedAt: record.committedAt?.toISOString() ?? null,
      releasedAt: record.releasedAt?.toISOString() ?? null,
      asset: record.asset ? this.asset(record.asset) : null,
    };
  }

  private asset(asset: MediaAsset) {
    if (!asset.mimeType || !asset.extension || asset.bytes <= 0n) {
      throw new Error('Backfilled asset without provider metadata cannot be returned as committed upload');
    }
    return {
      id: asset.id,
      provider: 'CLOUDINARY' as const,
      resourceType: asset.resourceType,
      kind: asset.kind,
      publicId: asset.publicId,
      secureUrl: asset.secureUrl,
      mimeType: asset.mimeType,
      extension: asset.extension,
      bytes: safeNumber(asset.bytes),
      width: asset.width,
      height: asset.height,
      durationSeconds: asset.durationSeconds === null ? null : Number(asset.durationSeconds),
      status: asset.status,
      createdAt: asset.createdAt.toISOString(),
      deletedAt: asset.deletedAt?.toISOString() ?? null,
    };
  }

  private account(record: Awaited<ReturnType<StorageRepository['getOrCreateAccount']>>) {
    return {
      user: record.user,
      policy: this.policy(record.policy),
      usage: this.usage({ ...record, quotaBytes: record.policy.quotaBytes, warningPercent: record.policy.warningPercent }),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private adjustment(record: {
    id: string;
    userId: string;
    actorId: string;
    deltaBytes: bigint;
    beforeBytes: bigint;
    afterBytes: bigint;
    reason: string;
    createdAt: Date;
  }) {
    return {
      id: record.id,
      userId: record.userId,
      actorId: record.actorId,
      deltaBytes: safeNumber(record.deltaBytes),
      beforeBytes: safeNumber(record.beforeBytes),
      afterBytes: safeNumber(record.afterBytes),
      reason: record.reason,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private quotaError(account: AccountLike, requestedBytes: bigint): AppError {
    const usage = this.usage(account);
    return new AppError({
      statusCode: 409,
      code: 'STORAGE_QUOTA_EXCEEDED',
      message: 'Dung lượng tài khoản không đủ cho upload này',
      fields: {
        usedBytes: [String(usage.usedBytes)],
        reservedBytes: [String(usage.reservedBytes)],
        limitBytes: [String(usage.limitBytes)],
        remainingBytes: [String(usage.remainingBytes)],
        requestedBytes: [requestedBytes.toString()],
      },
    });
  }

  private expiredError(reservation: { id: string; expiresAt: Date }): AppError {
    return new AppError({
      statusCode: 410,
      code: 'UPLOAD_RESERVATION_EXPIRED',
      message: 'Upload reservation đã hết hạn',
      fields: { reservationId: [reservation.id], expiresAt: [reservation.expiresAt.toISOString()] },
    });
  }

  private conflict(code: string, message: string): AppError {
    return new AppError({ statusCode: 409, code, message });
  }

  private notFound(): AppError {
    return new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy tài nguyên storage' });
  }
}
