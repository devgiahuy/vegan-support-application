export interface StorageUsage {
  usedBytes: number;
  reservedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  occupiedPercent: number;
  overQuota: boolean;
  warning: boolean;
  /** Dùng hết (hoặc vượt) hạn mức: không tải thêm được. */
  critical: boolean;
  /** Ngưỡng % bắt đầu cảnh báo do chính sách backend quy định. */
  warningPercent: number;
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

/** Ảnh đã tải lên và commit thành công, dùng để gắn vào bài đăng hoặc món riêng bằng `assetId`. */
export interface PickedImage {
  assetId: string;
  url: string;
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

/** Tệp ảnh hoặc video đã chọn từ thư viện/camera, chưa tải lên. */
export interface SelectedMedia {
  uri: string;
  name: string;
  mimeType: string;
  bytes: number;
  file?: File;
}

export type SelectedImage = SelectedMedia;

export interface ReservationInput {
  kind: 'COVER_IMAGE' | 'FRIDGE_IMAGE' | 'RECEIPT_IMAGE' | 'VIDEO';
  /** Tệp cần tải lên (ảnh, hoặc video khi `kind` là `VIDEO`). */
  image: SelectedMedia;
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
