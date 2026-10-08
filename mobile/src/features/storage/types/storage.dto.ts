export interface StorageUsageDto {
  usedBytes: number;
  reservedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  overQuota: boolean;
  warningPercent: number;
}

export interface StorageUsageResponseDto {
  usage: StorageUsageDto;
  policy: { name: string; reservationTtlSeconds: number };
}

export interface MediaAssetDto {
  id: string;
  secureUrl: string;
  bytes: number;
  mimeType: string;
}

export interface UploadReservationDto {
  id: string;
  asset: MediaAssetDto | null;
}

export interface UploadConfigurationDto {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  maxBytes: number;
  allowedMimeTypes: string[];
}

export interface CreateReservationRequestDto {
  kind: 'COVER_IMAGE' | 'FRIDGE_IMAGE' | 'RECEIPT_IMAGE';
  mimeType: string;
  extension: string;
  bytes: number;
  idempotencyKey: string;
}

export interface CreateReservationResponseDto {
  reservation: UploadReservationDto;
  usage: StorageUsageDto;
  upload: UploadConfigurationDto;
}

export interface CommitReservationRequestDto {
  publicId: string;
  version: number;
  signature: string;
}

export interface ReservationResponseDto {
  reservation: UploadReservationDto;
  usage: StorageUsageDto;
}

export interface ProviderUploadResponseDto {
  public_id?: string;
  version?: number;
  signature?: string;
}

export interface DeleteMediaAssetRequestDto {
  idempotencyKey: string;
}

/** Phản hồi `DELETE /storage/assets/:id` — chỉ dùng `usage` để cập nhật dung lượng. */
export interface StorageAssetResponseDto {
  asset: { id: string };
  usage: StorageUsageDto;
}
