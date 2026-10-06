import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';

/** Thông báo lỗi nghiệp vụ cho lưu/chia sẻ/gửi thẩm định AI artifact — phân nhánh theo `error.code`. */
export function getAiArtifactErrorMessage(error: unknown, fallback = 'Không thể hoàn tất thao tác. Vui lòng thử lại.'): string {
  switch (getApiErrorCode(error)) {
    case 'AUTH_REQUIRED':
      return 'Vui lòng đăng nhập để xem và chia sẻ tri thức AI.';
    case 'AI_ARTIFACT_ALREADY_SAVED':
      return 'Câu trả lời này đã được lưu thành tri thức AI trước đó.';
    case 'AI_ARTIFACT_SOURCE_NOT_ELIGIBLE':
      return 'Nội dung này chưa đủ điều kiện để lưu (cần là câu trả lời đã hoàn tất của bạn).';
    case 'AI_ARTIFACT_VERSION_CONFLICT':
    case 'AI_ARTIFACT_STATE_CONFLICT':
      return 'Bản ghi vừa được cập nhật ở nơi khác. Hãy tải lại danh sách rồi thử lại.';
    case 'AI_ARTIFACT_NOT_FOUND':
      return 'Bản ghi không còn tồn tại hoặc đã được thu hồi chia sẻ.';
    case 'AI_FEATURE_DISABLED':
      return 'Tính năng AI đang bảo trì. Vui lòng quay lại sau.';
    default:
      return getApiErrorMessage(error, fallback);
  }
}
