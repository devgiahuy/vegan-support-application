import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';

const suffixMessages: Record<string, string> = {
  IMAGE_LIMIT_EXCEEDED: 'Số ảnh vượt giới hạn của máy chủ. Giảm số ảnh và thử lại.',
  IMAGE_INVALID: 'Ảnh chưa được commit, không đúng loại hoặc không thuộc tài khoản này.',
  IDEMPOTENCY_CONFLICT: 'Yêu cầu đã thay đổi. Tải lại kết quả trước khi thử lại.',
  INGREDIENT_INVALID: 'Nguyên liệu chuẩn không còn khả dụng. Chọn lại nguyên liệu.',
  CANDIDATE_INVALID: 'Tên nguyên liệu cần chứa chữ hoặc số.',
  QUANTITY_INCOMPLETE: 'Cần nhập cả số lượng và đơn vị hoặc để trống cả hai.',
  CANDIDATE_INCOMPLETE: 'Bổ sung số lượng và đơn vị cho các mục được chọn.',
  PROVIDER_UNAVAILABLE: 'Dịch vụ nhận diện hiện không khả dụng. Nếu vừa đổi provider, hãy tạo tác vụ mới.',
  JOB_NOT_FOUND: 'Không tìm thấy tác vụ hoặc bạn không có quyền xem.',
  VERSION_CONFLICT: 'Kết quả đã thay đổi. Mở lại mục để sửa theo phiên bản mới.',
  STATE_CONFLICT: 'Tác vụ đã đổi trạng thái. Tải lại kết quả trước khi thao tác.',
};

export function scanningErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error) ?? '';
  const suffix = code.replace(/^(?:RECOGNITION|RECEIPT)_/, '');
  return suffixMessages[suffix] ?? getApiErrorMessage(error);
}
