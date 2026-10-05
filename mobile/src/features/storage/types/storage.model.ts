export interface StorageUsage {
  usedBytes: number;
  reservedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  occupiedPercent: number;
  overQuota: boolean;
  warning: boolean;
}

export interface StorageAccount {
  usage: StorageUsage;
  policyName: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  bytes: number;
  mimeType: string;
}

export interface UploadConfiguration {
  url: string;
  fields: Record<string, string>;
  maxBytes: number;
  allowedMimeTypes: string[];
}

export interface UploadReservation {
  id: string;
  asset: MediaAsset | null;
  usage: StorageUsage;
  upload: UploadConfiguration | null;
}

export interface SelectedImage {
  uri: string;
  name: string;
  mimeType: string;
  bytes: number;
  file?: File;
}

export interface ReservationInput {
  kind: 'COVER_IMAGE' | 'FRIDGE_IMAGE' | 'RECEIPT_IMAGE';
  image: SelectedImage;
  idempotencyKey: string;
}

export interface ProviderUploadReceipt {
  publicId: string;
  version: number;
  signature: string;
}

export interface UploadAttempt {
  key: string;
  reservationId: string | null;
  receipt: ProviderUploadReceipt | null;
}
