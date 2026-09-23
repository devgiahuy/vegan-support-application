export interface StorageUsageDto {
  usedBytes: number;
  reservedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  overQuota: boolean;
  warningPercent: number;
}

export interface StoragePolicyDto {
  id: string;
  code: string;
  name: string;
  quotaBytes: number;
  reservationTtlSeconds: number;
  warningPercent: number;
  active: boolean;
  isDefault: boolean;
  version: number;
  updatedAt: string;
}

export interface StorageUsageResponseDto {
  usage: StorageUsageDto;
  policy: StoragePolicyDto;
}

export interface MediaAssetDto {
  id: string;
  provider: string;
  resourceType: 'IMAGE' | 'VIDEO' | string;
  kind: 'COVER_IMAGE' | 'VIDEO' | string;
  publicId: string;
  secureUrl: string;
  mimeType: string;
  extension: string;
  bytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  status: 'COMMITTED' | 'DELETED' | string;
  createdAt: string;
  deletedAt: string | null;
}

export interface UploadReservationDto {
  id: string;
  status: 'RESERVED' | 'COMMITTED' | 'RELEASED' | 'EXPIRED' | string;
  resourceType: 'IMAGE' | 'VIDEO' | string;
  kind: 'COVER_IMAGE' | 'VIDEO' | string;
  declaredMimeType: string;
  declaredExtension: string;
  declaredBytes: number;
  actualBytes: number | null;
  expiresAt: string;
  committedAt: string | null;
  releasedAt: string | null;
  asset: MediaAssetDto | null;
}

export interface UploadProviderParamsDto {
  uploadUrl?: string;
  url?: string;
  cloudName?: string;
  apiKey?: string;
  resourceType?: string;
  timestamp?: number;
  signature?: string;
  folder?: string;
  maxBytes?: number;
  allowedMimeTypes?: string[];
  expiresAt?: string;
  fields?: Record<string, string>;
}

export interface CreateUploadReservationRequestDto {
  kind: 'COVER_IMAGE' | 'VIDEO';
  mimeType: string;
  extension: string;
  bytes: number;
  idempotencyKey: string;
}

export interface CreateUploadReservationResponseDto {
  reservation: UploadReservationDto;
  usage: StorageUsageDto;
  upload: UploadProviderParamsDto;
}

export interface CommitUploadReservationRequestDto {
  publicId: string;
  version: number;
  signature: string;
}

export interface UploadReservationResponseDto {
  reservation: UploadReservationDto;
  usage: StorageUsageDto;
}

export interface DeleteMediaAssetRequestDto {
  idempotencyKey: string;
}

export interface StorageAssetResponseDto {
  asset: MediaAssetDto;
  usage: StorageUsageDto;
}

export interface StorageAccountDto {
  userId: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
  usedBytes: number;
  reservedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  overQuota: boolean;
  warningPercent: number;
  quotaAdjustmentBytes: number;
  policy: StoragePolicyDto;
}

export interface StorageAccountListResponseDto {
  items: StorageAccountDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StorageAdjustmentDto {
  id: string;
  userId: string;
  adminUserId: string;
  deltaBytes: number;
  reason: string;
  createdAt: string;
}

export interface StorageAdjustmentListResponseDto {
  items: StorageAdjustmentDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StoragePolicyListResponseDto {
  items: StoragePolicyDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateStoragePolicyRequestDto {
  expectedVersion: number;
  name?: string;
  quotaBytes?: number;
  reservationTtlSeconds?: number;
  warningPercent?: number;
  active?: boolean;
}

export interface CreateStorageAdjustmentRequestDto {
  deltaBytes: number;
  reason: string;
  idempotencyKey: string;
}
