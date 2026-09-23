import axios from 'axios';
import { storageApi } from './storage.api';
import type { MediaAsset, MediaKind } from '../types/storage.model';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';

export interface UploadProgressInfo {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadWithReservationOptions {
  kind: MediaKind;
  onProgress?: (progress: UploadProgressInfo) => void;
  signal?: AbortSignal;
}

const ALLOWED_IMAGE_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
};

const ALLOWED_VIDEO_TYPES: Record<string, string[]> = {
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
};

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 250 * 1024 * 1024; // 250 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  extension?: string;
}

/**
 * Xác thực định dạng và dung lượng file tại client trước khi xin reservation.
 */
export function validateUploadFile(file: File, kind: MediaKind): FileValidationResult {
  const mimeType = file.type.toLowerCase().trim();
  const name = file.name.toLowerCase();

  // Trích xuất đuôi mở rộng có dấu chấm (e.g. ".jpg")
  const lastDot = name.lastIndexOf('.');
  const extension = lastDot !== -1 ? name.substring(lastDot) : '';

  if (kind === 'COVER_IMAGE') {
    if (file.size > MAX_IMAGE_BYTES) {
      return {
        valid: false,
        error: `Ảnh vượt quá dung lượng tối đa 10 MB (tệp hiện tại: ${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
      };
    }

    const validExtensions = ALLOWED_IMAGE_TYPES[mimeType];
    if (!validExtensions || !validExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận JPG, JPEG, PNG, WEBP, AVIF.',
      };
    }

    return { valid: true, extension };
  }

  if (kind === 'VIDEO') {
    if (file.size > MAX_VIDEO_BYTES) {
      return {
        valid: false,
        error: `Video vượt quá dung lượng tối đa 250 MB (tệp hiện tại: ${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
      };
    }

    const validExtensions = ALLOWED_VIDEO_TYPES[mimeType];
    if (!validExtensions || !validExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Định dạng video không được hỗ trợ. Chỉ chấp nhận MP4, WebM, QuickTime MOV.',
      };
    }

    return { valid: true, extension };
  }

  return { valid: false, error: 'Loại tệp không được hỗ trợ.' };
}

/**
 * Thực hiện trọn gói luồng upload an toàn 3 bước có rollback:
 * 1. POST /uploads/reservations (xin giữ trước dung lượng)
 * 2. Upload file trực tiếp lên Cloudinary CDN
 * 3. POST /uploads/reservations/:id/commit (xác nhận hoàn tất)
 * Tự động giải phóng reservation (release) nếu upload bị hủy hoặc gặp lỗi.
 */
export async function uploadWithReservation(
  file: File,
  options: UploadWithReservationOptions
): Promise<MediaAsset> {
  const { kind, onProgress, signal } = options;

  // Bước 0: Validate client-side
  const validation = validateUploadFile(file, kind);
  if (!validation.valid || !validation.extension) {
    throw new Error(validation.error || 'Tệp không hợp lệ.');
  }

  if (signal?.aborted) {
    throw new Error('Thao tác tải lên đã bị hủy.');
  }

  // Bước 1: Khởi tạo reservation với backend
  let reservationId: string | null = null;
  const idempotencyKey = crypto.randomUUID();

  try {
    const reservationRes = await storageApi.createReservation({
      kind,
      mimeType: file.type.toLowerCase().trim(),
      extension: validation.extension,
      bytes: file.size,
      idempotencyKey,
    });

    reservationId = reservationRes.reservation.id;
    const { upload } = reservationRes;

    const uploadUrl = upload?.uploadUrl || upload?.url;
    if (!uploadUrl) {
      throw new Error('Không nhận được địa chỉ máy chủ tải lên từ hệ thống.');
    }

    if (signal?.aborted) {
      throw new Error('Thao tác tải lên đã bị hủy.');
    }

    // Bước 2: Tải trực tiếp file lên Cloudinary CDN bằng FormData
    const formData = new FormData();
    formData.append('file', file);
    if (upload.apiKey) formData.append('api_key', upload.apiKey);
    if (upload.timestamp) formData.append('timestamp', String(upload.timestamp));
    if (upload.signature) formData.append('signature', upload.signature);
    if (upload.folder) formData.append('folder', upload.folder);
    if (upload.fields) {
      Object.entries(upload.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const cdnResponse = await axios.post<{
      public_id: string;
      version: number;
      signature?: string;
      secure_url?: string;
      bytes?: number;
    }>(uploadUrl, formData, {
      signal,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.min(
            100,
            Math.round((progressEvent.loaded * 100) / progressEvent.total)
          );
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percent,
          });
        }
      },
    });

    const cdnData = cdnResponse.data;
    if (!cdnData.public_id || !cdnData.version) {
      throw new Error('Máy chủ đám mây không trả về thông tin nhận diện tệp tải lên.');
    }

    // Chữ ký từ Cloudinary: trường hợp mock hoặc upload unsigned/test thì fallback chuỗi an toàn
    const signature =
      cdnData.signature || upload.signature || '0000000000000000000000000000000000000000';

    if (signal?.aborted) {
      throw new Error('Thao tác tải lên đã bị hủy.');
    }

    // Bước 3: Commit reservation
    const commitRes = await storageApi.commitReservation(reservationId, {
      publicId: cdnData.public_id,
      version: cdnData.version,
      signature,
    });

    if (!commitRes.reservation.asset) {
      throw new Error('Không thể khởi tạo media asset sau khi xác nhận tải lên.');
    }

    return commitRes.reservation.asset;
  } catch (error: unknown) {
    // Nếu đã tạo reservation mà gặp lỗi hoặc bị hủy, gọi releaseReservation để hoàn trả dung lượng
    if (reservationId) {
      storageApi.releaseReservation(reservationId).catch(() => {
        // Background release - nếu lỗi kết nối worker backend sẽ dọn dẹp theo TTL
      });
    }

    // Xử lý mã lỗi nghiệp vụ chuẩn hóa
    const code = getApiErrorCode(error);
    if (code === 'STORAGE_QUOTA_EXCEEDED') {
      throw new Error(
        'Dung lượng lưu trữ tài khoản của bạn đã đầy. Vui lòng xóa bớt ảnh/video cũ.'
      );
    }
    if (code === 'UPLOAD_RESERVATION_EXPIRED') {
      throw new Error('Phiên tải lên đã hết hạn (quá 15 phút). Vui lòng thử lại.');
    }
    if (code === 'UPLOAD_PROVIDER_MISMATCH') {
      throw new Error('Thông số tệp tải lên không khớp với đăng ký an toàn.');
    }
    if (code === 'UPLOAD_PROVIDER_FAILED') {
      throw new Error('Không thể kết nối đến máy chủ lưu trữ đám mây. Vui lòng thử lại sau.');
    }

    if (axios.isCancel(error) || (error instanceof Error && error.name === 'CanceledError')) {
      throw new Error('Đã hủy tải lên.');
    }

    throw new Error(
      getApiErrorMessage(error, error instanceof Error ? error.message : 'Tải lên thất bại.')
    );
  }
}
