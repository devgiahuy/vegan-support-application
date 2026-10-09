import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
const messages: Record<string, string> = {
  STORAGE_QUOTA_EXCEEDED: 'Tài khoản không còn đủ dung lượng để tải ảnh này.',
  UPLOAD_RESERVATION_EXPIRED: 'Phiên tải lên đã hết hạn. Hãy chọn lại ảnh và thử lại.',
  UPLOAD_PROVIDER_MISMATCH: 'Tệp tải lên không khớp thông tin đã đăng ký.',
  UPLOAD_PROVIDER_FAILED: 'Không kết nối được máy chủ lưu trữ ảnh. Vui lòng thử lại.',
  UPLOAD_IDEMPOTENCY_CONFLICT: 'Thông tin ảnh đã thay đổi. Hãy chọn lại ảnh.',
  UPLOAD_RESERVATION_CONFLICT: 'Phiên tải lên đã thay đổi. Hãy tải lại dung lượng tài khoản.',
  MEDIA_ASSET_IN_USE: 'Tệp này vẫn đang được dùng ở nội dung khác nên chưa thể xóa.',
  MEDIA_DELETE_IDEMPOTENCY_CONFLICT: 'Tệp này đã được xóa bằng một thao tác khác.',
  MEDIA_DELETE_FAILED: 'Máy chủ lưu trữ chưa xác nhận xóa tệp. Vui lòng thử lại sau.',
};
export function storageErrorMessage(error: unknown): string {
  return messages[getApiErrorCode(error) ?? ''] ?? getApiErrorMessage(error);
}
