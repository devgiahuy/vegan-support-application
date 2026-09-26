export type ReservationStatus = 'RESERVED' | 'COMMITTED' | 'RELEASED' | 'EXPIRED' | string;
export type MediaResourceType = 'IMAGE' | 'VIDEO' | string;
export type MediaKind = 'COVER_IMAGE' | 'VIDEO';
export type MediaAssetStatus = 'COMMITTED' | 'DELETED' | string;

export interface StorageUsage {
  usedBytes: number;
  reservedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  overQuota: boolean;
  warningPercent: number;
  usedFormatted: string;
  limitFormatted: string;
  remainingFormatted: string;
  percentUsed: number;
  isWarning: boolean;
  isCritical: boolean;
}

export interface StoragePolicy {
  id: string;
  code: string;
  name: string;
  quotaBytes: number;
  quotaFormatted: string;
  reservationTtlSeconds: number;
  reservationTtlMinutes: number;
  warningPercent: number;
  active: boolean;
  isDefault: boolean;
  version: number;
  updatedAt: Date | null;
}

export interface MediaAsset {
  id: string;
  provider: string;
  resourceType: MediaResourceType;
  kind: MediaKind;
  publicId: string;
  secureUrl: string;
  mimeType: string;
  extension: string;
  bytes: number;
  sizeFormatted: string;
  width: number | null;
  height: number | null;
  aspectRatio: string | null;
  durationSeconds: number | null;
  durationFormatted: string | null;
  status: MediaAssetStatus;
  createdAt: Date | null;
  deletedAt: Date | null;
}

export interface UploadReservation {
  id: string;
  status: ReservationStatus;
  resourceType: MediaResourceType;
  kind: MediaKind;
  declaredMimeType: string;
  declaredExtension: string;
  declaredBytes: number;
  declaredSizeFormatted: string;
  actualBytes: number | null;
  actualSizeFormatted: string | null;
  expiresAt: Date | null;
  committedAt: Date | null;
  releasedAt: Date | null;
  asset: MediaAsset | null;
}

export interface StorageAccount {
  userId: string;
  userEmail: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  usedBytes: number;
  usedFormatted: string;
  limitBytes: number;
  limitFormatted: string;
  remainingBytes: number;
  remainingFormatted: string;
  percentUsed: number;
  overQuota: boolean;
  warningPercent: number;
  quotaAdjustmentBytes: number;
  adjustmentFormatted: string;
  policy: StoragePolicy;
}

export interface StorageAdjustment {
  id: string;
  userId: string;
  adminUserId: string;
  deltaBytes: number;
  deltaFormatted: string;
  reason: string;
  createdAt: Date | null;
}
