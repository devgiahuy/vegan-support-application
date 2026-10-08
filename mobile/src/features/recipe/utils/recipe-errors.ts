import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';

/** Thông báo lỗi nghiệp vụ khi đăng/sửa nội dung (công thức, bài viết, video) — dựa vào `error.code`. */
export function getContentErrorMessage(error: unknown, fallback = 'Vui lòng kiểm tra dữ liệu và thử lại.'): string {
  switch (getApiErrorCode(error)) {
    case 'INGREDIENT_ID_NAME_MISMATCH':
      return 'Tên một nguyên liệu không khớp với nguyên liệu chuẩn đã chọn. Hãy xóa dòng đó và chọn lại từ gợi ý, hoặc nhập tên tự do.';
    case 'CONTENT_VERSION_CONFLICT':
      return 'Nội dung đã được cập nhật ở nơi khác. Hãy mở lại bài để lấy bản mới nhất rồi chỉnh sửa lại.';
    case 'INVALID_CONTENT':
      return 'Nội dung chưa đạt yêu cầu. Vui lòng kiểm tra lại các trường bắt buộc.';
    default:
      return getApiErrorMessage(error, fallback);
  }
}
