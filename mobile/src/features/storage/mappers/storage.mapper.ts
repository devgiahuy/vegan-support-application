import { BaseMapper } from '@/lib/mapper';
import type {
  CommitReservationRequestDto,
  CreateReservationRequestDto,
  CreateReservationResponseDto,
  ProviderUploadResponseDto,
  ReservationResponseDto,
  StorageUsageDto,
  StorageUsageResponseDto,
} from '../types/storage.dto';
import type {
  ProviderUploadReceipt,
  ReservationInput,
  StorageAccount,
  StorageUsage,
  UploadReservation,
} from '../types/storage.model';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function validateImage(image: { name: string; mimeType: string; bytes: number }): string {
  const supported: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/avif': ['avif'],
  };
  const extension = image.name.split('.').pop()?.toLowerCase() ?? '';
  if (!supported[image.mimeType]?.includes(extension))
    throw new Error('Chọn ảnh JPG, PNG, WebP hoặc AVIF có định dạng khớp tên tệp.');
  if (!Number.isSafeInteger(image.bytes) || image.bytes <= 0)
    throw new Error('Không đọc được dung lượng ảnh. Hãy chọn lại ảnh.');
  if (image.bytes > 10 * 1024 * 1024) throw new Error('Ảnh vượt giới hạn 10 MB.');
  return `.${extension}`;
}

export class StorageMapper extends BaseMapper<StorageUsageResponseDto, StorageAccount> {
  toUsage(dto: StorageUsageDto): StorageUsage {
    const occupied = dto.usedBytes + dto.reservedBytes;
    const percent = dto.limitBytes > 0 ? (occupied * 100) / dto.limitBytes : occupied > 0 ? 100 : 0;
    return {
      usedBytes: dto.usedBytes,
      reservedBytes: dto.reservedBytes,
      limitBytes: dto.limitBytes,
      remainingBytes: dto.remainingBytes,
      occupiedPercent: Math.min(100, Math.max(0, percent)),
      overQuota: dto.overQuota,
      warning: dto.overQuota || percent >= dto.warningPercent,
    };
  }
  toModel(dto: StorageUsageResponseDto | null | undefined): StorageAccount {
    if (!dto) throw new Error('Không nhận được dung lượng tài khoản.');
    return { usage: this.toUsage(dto.usage), policyName: dto.policy.name };
  }
  toReservation(
    dto: CreateReservationResponseDto | ReservationResponseDto | undefined
  ): UploadReservation {
    if (!dto) throw new Error('Không nhận được thông tin phiên tải lên.');
    const config = 'upload' in dto ? dto.upload : null;
    return {
      id: dto.reservation.id,
      asset: dto.reservation.asset
        ? {
            id: dto.reservation.asset.id,
            url: dto.reservation.asset.secureUrl,
            bytes: dto.reservation.asset.bytes,
            mimeType: dto.reservation.asset.mimeType,
          }
        : null,
      usage: this.toUsage(dto.usage),
      upload: config
        ? {
            url: config.uploadUrl,
            fields: {
              api_key: config.apiKey,
              timestamp: String(config.timestamp),
              signature: config.signature,
              folder: config.folder,
            },
            maxBytes: config.maxBytes,
            allowedMimeTypes: config.allowedMimeTypes,
          }
        : null,
    };
  }
  toCreateDto(input: ReservationInput): CreateReservationRequestDto {
    return {
      kind: input.kind,
      mimeType: input.image.mimeType,
      extension: validateImage(input.image),
      bytes: input.image.bytes,
      idempotencyKey: input.idempotencyKey,
    };
  }
  toProviderReceipt(dto: ProviderUploadResponseDto): ProviderUploadReceipt {
    if (!dto.public_id || !dto.version || !dto.signature || !/^[a-f0-9]{40}$/i.test(dto.signature))
      throw new Error('Máy chủ tải lên thiếu thông tin hoặc chữ ký xác nhận.');
    return {
      publicId: dto.public_id,
      version: dto.version,
      signature: dto.signature,
    };
  }
  toCommitDto(receipt: ProviderUploadReceipt): CommitReservationRequestDto {
    return {
      publicId: receipt.publicId,
      version: receipt.version,
      signature: receipt.signature,
    };
  }
}

export const storageMapper = new StorageMapper();
