export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Kiểm tra tệp hình ảnh tải lên theo định dạng và kích thước tối đa 5MB
 */
export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Định dạng ảnh không hợp lệ (${file.type || 'không rõ'}). Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Dung lượng ảnh (${formatBytes(file.size)}) vượt quá giới hạn tối đa cho phép (5 MB).`,
    };
  }

  return { valid: true };
}

/**
 * Kiểm tra tệp video tải lên theo định dạng và kích thước tối đa 100MB
 */
export function validateVideoFile(file: File): ValidationResult {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Định dạng video không hợp lệ (${file.type || 'không rõ'}). Chỉ chấp nhận video MP4 hoặc WebM.`,
    };
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return {
      valid: false,
      error: `Dung lượng video (${formatBytes(file.size)}) vượt quá giới hạn tối đa cho phép (100 MB).`,
    };
  }

  return { valid: true };
}
