import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
const messages: Record<string, string> = {
  STORAGE_QUOTA_EXCEEDED: 'Tài khoản không còn đủ dung lượng để tải ảnh này.',
  UPLOAD_RESERVATION_EXPIRED: 'Phiên tải lên đã hết hạn. Hãy chọn lại ảnh và thử lại.',
  UPLOAD_PROVIDER_MISMATCH: 'Tệp tải lên không khớp thông tin đã đăng ký.',
  UPLOAD_PROVIDER_FAILED: 'Không kết nối được máy chủ lưu trữ ảnh. Vui lòng thử lại.',
  UPLOAD_IDEMPOTENCY_CONFLICT: 'Thông tin ảnh đã thay đổi. Hãy chọn lại ảnh.',
  UPLOAD_RESERVATION_CONFLICT: 'Phiên tải lên đã thay đổi. Hãy tải lại dung lượng tài khoản.',
};
export function storageErrorMessage(error: unknown): string {
  return messages[getApiErrorCode(error) ?? ''] ?? getApiErrorMessage(error);
}
