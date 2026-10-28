import { getApiErrorCode, getApiErrorFields, getApiErrorMessage } from '@/lib/api-error';
import type { ContentReviewDecision } from '../types/content-review.model';

/** Dịch lỗi validate lý do của BE (thường là thông điệp Zod tiếng Anh) sang tiếng Việt. */
export function localizeReviewReasonError(raw: string, decision: ContentReviewDecision): string {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const verb = decision === 'APPROVE' ? 'duyệt' : 'từ chối';
  if (lower.includes('too small') || lower.includes('>=10') || lower.includes('>= 10') || lower.includes('at least 10') || lower.includes('10 character')) {
    return `Lý do ${verb} phải có ít nhất 10 ký tự.`;
  }
  if (lower.includes('too big') || lower.includes('<=2000') || lower.includes('<= 2000') || lower.includes('at most 2000') || lower.includes('2000 character')) {
    return 'Lý do không được vượt quá 2000 ký tự.';
  }
  if (lower.includes('required') || lower.includes('received null') || lower.includes('received undefined')) {
    return `Vui lòng nhập lý do ${verb} (tối thiểu 10 ký tự).`;
  }
  if (text.length > 0 && !lower.includes('expected string') && !lower.includes('invalid')) return text;
  return `Lý do ${verb} phải có ít nhất 10 ký tự.`;
}

/** Thông báo lỗi nghiệp vụ khi duyệt/từ chối (luôn dựa vào `error.code`). */
export function getContentReviewErrorMessage(error: unknown, decision: ContentReviewDecision = 'APPROVE'): string {
  const code = getApiErrorCode(error);
  switch (code) {
    case 'SELF_APPROVAL_FORBIDDEN':
      return 'Bạn không thể tự duyệt nội dung do chính mình tạo. Hãy để người kiểm duyệt khác xử lý.';
    case 'ADMIN_REVIEW_REQUIRED':
      return 'Nội dung này cần Quản trị viên xử lý (đã bị cảnh báo/báo cáo hoặc không phải của Member).';
    case 'REVIEW_ALREADY_DECIDED':
    case 'REVIEW_CONFLICT':
      return 'Bản nộp này đã được người kiểm duyệt khác xử lý trước đó. Hàng chờ sẽ được tải lại.';
    case 'CONTENT_STATE_CONFLICT':
      return 'Trạng thái nội dung đã thay đổi. Hãy tải lại hàng chờ rồi thử lại.';
    case 'CONTENT_AUTHOR_INACTIVE':
      return 'Tác giả không còn hoạt động nên không thể quyết định nội dung này.';
    case 'NOT_FOUND':
      return 'Không tìm thấy bản nộp này. Có thể nó đã bị xử lý hoặc gỡ.';
    case 'FORBIDDEN':
      return 'Tài khoản của bạn không có quyền duyệt nội dung.';
    case 'VALIDATION_ERROR': {
      const reason = getApiErrorFields(error)?.reason;
      if (reason !== undefined) {
        const raw = Array.isArray(reason) ? reason.map((item) => String(item)).join(', ') : String(reason);
        return localizeReviewReasonError(raw, decision);
      }
      return getApiErrorMessage(error, 'Quyết định kiểm duyệt không hợp lệ.');
    }
    default:
      return getApiErrorMessage(error, 'Không thể hoàn tất quyết định kiểm duyệt.');
  }
}

/** Lỗi nghĩa là bản nộp đã được xử lý/đổi trạng thái: cần đóng hộp thoại và tải lại hàng chờ. */
export function isReviewStaleError(error: unknown): boolean {
  const code = getApiErrorCode(error);
  return code === 'REVIEW_ALREADY_DECIDED' || code === 'REVIEW_CONFLICT' || code === 'CONTENT_STATE_CONFLICT' || code === 'NOT_FOUND';
}
