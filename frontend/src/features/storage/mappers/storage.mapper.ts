import { pickField, safeBoolean, safeDate, safeNumber, safeString } from '@/lib/mapper';
import { calculateUsedPercent, formatBytes, formatDeltaBytes } from '../utils/format-bytes';
import type {
  MediaAssetDto,
  StorageAccountDto,
  StorageAdjustmentDto,
  StoragePolicyDto,
  StorageUsageDto,
  UploadReservationDto,
} from '../types/storage.dto';
import type {
  MediaAsset,
  StorageAccount,
  StorageAdjustment,
  StoragePolicy,
  StorageUsage,
  UploadReservation,
} from '../types/storage.model';

export class StorageMapper {
  toUsageModel(dto: StorageUsageDto | null | undefined): StorageUsage {
    const usedBytes = safeNumber(pickField(dto, ['usedBytes', 'used_bytes'], 0));
    const reservedBytes = safeNumber(pickField(dto, ['reservedBytes', 'reserved_bytes'], 0));
    const limitBytes = safeNumber(pickField(dto, ['limitBytes', 'limit_bytes'], 1073741824));
    const remainingBytes = safeNumber(
      pickField(
        dto,
        ['remainingBytes', 'remaining_bytes'],
        Math.max(0, limitBytes - usedBytes - reservedBytes)
      )
    );
    const warningPercent = safeNumber(pickField(dto, ['warningPercent', 'warning_percent'], 80));
    const overQuota = safeBoolean(pickField(dto, ['overQuota', 'over_quota'], false));

    const percentUsed = calculateUsedPercent(usedBytes, limitBytes);
    const isWarning = percentUsed >= warningPercent || overQuota;
    const isCritical = percentUsed >= 100 || overQuota;

    return {
      usedBytes,
      reservedBytes,
      limitBytes,
      remainingBytes,
      overQuota,
      warningPercent,
      usedFormatted: formatBytes(usedBytes),
      limitFormatted: formatBytes(limitBytes),
      remainingFormatted: formatBytes(remainingBytes),
      percentUsed,
      isWarning,
      isCritical,
    };
  }

  toPolicyModel(dto: StoragePolicyDto | null | undefined): StoragePolicy {
    const quotaBytes = safeNumber(pickField(dto, ['quotaBytes', 'quota_bytes'], 1073741824));
    const reservationTtlSeconds = safeNumber(
      pickField(dto, ['reservationTtlSeconds', 'reservation_ttl_seconds'], 900)
    );

    return {
      id: safeString(pickField(dto, ['id'], '')),
      code: safeString(pickField(dto, ['code'], 'DEFAULT_MEMBER')),
      name: safeString(pickField(dto, ['name'], 'Chính sách mặc định')),
      quotaBytes,
      quotaFormatted: formatBytes(quotaBytes),
      reservationTtlSeconds,
      reservationTtlMinutes: Math.round(reservationTtlSeconds / 60),
      warningPercent: safeNumber(pickField(dto, ['warningPercent', 'warning_percent'], 80)),
      active: safeBoolean(pickField(dto, ['active'], true)),
      isDefault: safeBoolean(pickField(dto, ['isDefault', 'is_default'], true)),
      version: safeNumber(pickField(dto, ['version'], 1)),
      updatedAt: safeDate(pickField(dto, ['updatedAt', 'updated_at'], null)),
    };
  }

  toMediaAssetModel(dto: MediaAssetDto | null | undefined): MediaAsset | null {
    if (!dto) return null;

    const bytes = safeNumber(pickField(dto, ['bytes'], 0));
    const width = dto.width !== undefined && dto.width !== null ? safeNumber(dto.width) : null;
    const height = dto.height !== undefined && dto.height !== null ? safeNumber(dto.height) : null;
    const durationSeconds =
      dto.durationSeconds !== undefined && dto.durationSeconds !== null
        ? safeNumber(dto.durationSeconds)
        : null;

    let aspectRatio: string | null = null;
    if (width && height && width > 0 && height > 0) {
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(width, height);
      aspectRatio = `${width / divisor}:${height / divisor}`;
    }

    let durationFormatted: string | null = null;
    if (durationSeconds !== null) {
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = Math.floor(durationSeconds % 60);
      durationFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return {
      id: safeString(pickField(dto, ['id'], '')),
      provider: safeString(pickField(dto, ['provider'], 'CLOUDINARY')),
      resourceType: safeString(pickField(dto, ['resourceType', 'resource_type'], 'IMAGE')),
      kind:
        safeString(pickField(dto, ['kind'], 'COVER_IMAGE')) === 'VIDEO' ? 'VIDEO' : 'COVER_IMAGE',
      publicId: safeString(pickField(dto, ['publicId', 'public_id'], '')),
      secureUrl: safeString(pickField(dto, ['secureUrl', 'secure_url'], '')),
      mimeType: safeString(pickField(dto, ['mimeType', 'mime_type'], '')),
      extension: safeString(pickField(dto, ['extension'], '')),
      bytes,
      sizeFormatted: formatBytes(bytes),
      width,
      height,
      aspectRatio,
      durationSeconds,
      durationFormatted,
      status: safeString(pickField(dto, ['status'], 'COMMITTED')),
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
      deletedAt: safeDate(pickField(dto, ['deletedAt', 'deleted_at'], null)),
    };
  }

  toReservationModel(dto: UploadReservationDto | null | undefined): UploadReservation {
    const declaredBytes = safeNumber(pickField(dto, ['declaredBytes', 'declared_bytes'], 0));
    const actualBytes =
      dto?.actualBytes !== undefined && dto?.actualBytes !== null
        ? safeNumber(dto.actualBytes)
        : null;

    return {
      id: safeString(pickField(dto, ['id'], '')),
      status: safeString(pickField(dto, ['status'], 'RESERVED')),
      resourceType: safeString(pickField(dto, ['resourceType', 'resource_type'], 'IMAGE')),
      kind:
        safeString(pickField(dto, ['kind'], 'COVER_IMAGE')) === 'VIDEO' ? 'VIDEO' : 'COVER_IMAGE',
      declaredMimeType: safeString(pickField(dto, ['declaredMimeType', 'declared_mime_type'], '')),
      declaredExtension: safeString(
        pickField(dto, ['declaredExtension', 'declared_extension'], '')
      ),
      declaredBytes,
      declaredSizeFormatted: formatBytes(declaredBytes),
      actualBytes,
      actualSizeFormatted: actualBytes !== null ? formatBytes(actualBytes) : null,
      expiresAt: safeDate(pickField(dto, ['expiresAt', 'expires_at'], null)),
      committedAt: safeDate(pickField(dto, ['committedAt', 'committed_at'], null)),
      releasedAt: safeDate(pickField(dto, ['releasedAt', 'released_at'], null)),
      asset: this.toMediaAssetModel(dto?.asset),
    };
  }

  toAccountModel(dto: StorageAccountDto | null | undefined): StorageAccount {
    const usedBytes = safeNumber(pickField(dto, ['usedBytes', 'used_bytes'], 0));
    const limitBytes = safeNumber(pickField(dto, ['limitBytes', 'limit_bytes'], 1073741824));
    const remainingBytes = safeNumber(pickField(dto, ['remainingBytes', 'remaining_bytes'], 0));
    const quotaAdjustmentBytes = safeNumber(
      pickField(dto, ['quotaAdjustmentBytes', 'quota_adjustment_bytes'], 0)
    );
    const warningPercent = safeNumber(pickField(dto, ['warningPercent', 'warning_percent'], 80));
    const overQuota = safeBoolean(pickField(dto, ['overQuota', 'over_quota'], false));

    return {
      userId: safeString(pickField(dto, ['userId', 'user_id'], '')),
      userEmail: safeString(pickField(dto?.user, ['email'], 'Chưa cập nhật')),
      userDisplayName: safeString(
        pickField(dto?.user, ['displayName', 'display_name'], 'Người dùng')
      ),
      userAvatarUrl: dto?.user?.avatarUrl ? safeString(dto.user.avatarUrl) : null,
      usedBytes,
      usedFormatted: formatBytes(usedBytes),
      limitBytes,
      limitFormatted: formatBytes(limitBytes),
      remainingBytes,
      remainingFormatted: formatBytes(remainingBytes),
      percentUsed: calculateUsedPercent(usedBytes, limitBytes),
      overQuota,
      warningPercent,
      quotaAdjustmentBytes,
      adjustmentFormatted: formatDeltaBytes(quotaAdjustmentBytes),
      policy: this.toPolicyModel(dto?.policy),
    };
  }

  toAdjustmentModel(dto: StorageAdjustmentDto | null | undefined): StorageAdjustment {
    const deltaBytes = safeNumber(pickField(dto, ['deltaBytes', 'delta_bytes'], 0));

    return {
      id: safeString(pickField(dto, ['id'], '')),
      userId: safeString(pickField(dto, ['userId', 'user_id'], '')),
      adminUserId: safeString(pickField(dto, ['adminUserId', 'admin_user_id'], '')),
      deltaBytes,
      deltaFormatted: formatDeltaBytes(deltaBytes),
      reason: safeString(pickField(dto, ['reason'], '')),
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
    };
  }
}

export const storageMapper = new StorageMapper();
