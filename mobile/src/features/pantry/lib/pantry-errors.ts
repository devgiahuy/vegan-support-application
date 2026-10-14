import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';

const messages: Record<string, string> = {
  PANTRY_NEGATIVE_QUANTITY: 'Số lượng dùng vượt quá số lượng hiện có.',
  PANTRY_UNIT_CONVERSION_UNAVAILABLE:
    'Chưa có quy đổi cho đơn vị này. Dùng đơn vị đang lưu của nguyên liệu.',
  PANTRY_MERGE_INCOMPATIBLE: 'Các nguyên liệu hoặc đơn vị này không tương thích để gộp.',
  PANTRY_MERGE_CONFLICT: 'Danh sách đã thay đổi. Chọn lại nguyên liệu và xem trước lần nữa.',
  PANTRY_IDEMPOTENCY_CONFLICT: 'Yêu cầu đã thay đổi. Đóng biểu mẫu và thử lại.',
  PANTRY_DATE_INVALID: 'Ngày mua, ngày mở hoặc hạn dùng không hợp lệ.',
  PANTRY_VERSION_CONFLICT: 'Nguyên liệu đã thay đổi. Đóng biểu mẫu và mở lại để lấy số lượng mới.',
  PANTRY_ITEM_VERSION_CONFLICT:
    'Nguyên liệu đã thay đổi. Đóng biểu mẫu và mở lại để lấy số lượng mới.',
  PANTRY_MERGE_VERSION_CONFLICT:
    'Danh sách đã thay đổi. Chọn lại nguyên liệu và xem trước lần nữa.',
  PANTRY_INSUFFICIENT_QUANTITY: 'Số lượng dùng vượt quá số lượng hiện có.',
  PANTRY_NEGATIVE_BALANCE: 'Số lượng còn lại không được nhỏ hơn 0.',
  PANTRY_MERGE_IDENTITY_MISMATCH: 'Chỉ gộp các mục có cùng nguyên liệu.',
  PANTRY_MERGE_UNIT_MISMATCH: 'Các đơn vị này chưa thể quy đổi để gộp.',
  PANTRY_ITEM_NOT_FOUND: 'Nguyên liệu không còn trong tủ bếp. Hãy tải lại danh sách.',
};

export function pantryErrorMessage(error: unknown): string {
  return messages[getApiErrorCode(error) ?? ''] ?? getApiErrorMessage(error);
}
