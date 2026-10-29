import { AxiosError } from 'axios';
import { ErrorResponse } from '@/types/api';

/**
 * Type guard để kiểm tra một unknown error có phải AxiosError không.
 */
export const isAxiosError = (error: unknown): error is AxiosError<ErrorResponse> => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
};

/**
 * Kiểm tra lỗi mạng (không nhận được response, ví dụ backend chưa chạy/không kết nối được).
 */
export const isNetworkError = (error: unknown): boolean => {
  if (isAxiosError(error)) {
    return !error.response && !!error.request;
  }
  return false;
};

/** Kiểm tra lỗi hết thời gian chờ (đã gửi request nhưng máy chủ chưa kịp trả lời). */
export const isTimeoutError = (error: unknown): boolean => {
  return isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT');
};

/** Lấy HTTP status code từ lỗi API. */
export const getApiErrorStatus = (error: unknown): number | undefined => {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
};

/** Lấy payload lỗi thô từ response. */
export const getApiErrorData = (error: unknown): ErrorResponse | undefined => {
  if (isAxiosError(error)) {
    return error.response?.data;
  }
  return undefined;
};

/**
 * Đọc business error code (`error.code`, envelope lồng). Luôn branch theo code này,
 * không branch theo message text.
 */
export const getApiErrorCode = (error: unknown): string | undefined => {
  const data = getApiErrorData(error);
  if (!data) return undefined;
  const nested = data.error?.code;
  if (typeof nested === 'string' && nested.length > 0) return nested;
  return undefined;
};

/** Đọc lỗi validation theo từng field (`error.fields`, envelope lồng). */
export const getApiErrorFields = (error: unknown): Record<string, unknown> | undefined => {
  const data = getApiErrorData(error);
  const fields = data?.error?.fields;
  if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
    return fields as Record<string, unknown>;
  }
  return undefined;
};

/** Trích message thân thiện để hiển thị cho user (tiếng Việt, theo message backend trả về). */
export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string = 'Thao tác thất bại. Vui lòng thử lại.'
): string => {
  if (isAxiosError(error)) {
    const errorData = error.response?.data;
    if (errorData) {
      const nestedMessage = errorData.error?.message;
      if (typeof nestedMessage === 'string' && nestedMessage.length > 0) return nestedMessage;
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        return errorData.errors.map((e) => e.message).join(', ');
      }
      return (
        errorData.message ||
        errorData.detail ||
        errorData.Detail ||
        errorData.title ||
        fallbackMessage
      );
    }
    if (isNetworkError(error)) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền hoặc API_BASE_URL.';
    }
  } else if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
};

// Nhãn tiếng Việt của các field hay gặp — đồng bộ `FIELD_LABELS` của web (`frontend/src/lib/api-error.ts`).
const FIELD_LABELS: Record<string, string> = {
  body: 'Nội dung bài viết',
  content: 'Nội dung bài viết',
  title: 'Tiêu đề',
  excerpt: 'Đoạn trích tóm tắt',
  summary: 'Đoạn trích tóm tắt',
  categoryIds: 'Chuyên mục',
  category: 'Chuyên mục',
  tags: 'Thẻ (Tags)',
  coverImageUrl: 'Ảnh bìa',
  email: 'Email',
  password: 'Mật khẩu',
  name: 'Tên',
  displayName: 'Tên hiển thị',
  reason: 'Lý do',
  description: 'Mô tả',
};

/** Việt hóa một lỗi validation (thường là thông điệp Zod tiếng Anh) của một field. */
export function localizeFieldValidation(field: string, rawMessage: string): string {
  const label = FIELD_LABELS[field] || field;

  let translated = rawMessage;
  const tooSmallMatch = rawMessage.match(/^Too small: expected string to have >=(\d+) characters/i);
  if (tooSmallMatch) {
    translated = `quá ngắn (yêu cầu tối thiểu ${tooSmallMatch[1]} ký tự)`;
  } else {
    const tooBigMatch = rawMessage.match(/^Too big: expected string to have <=(\d+) characters/i);
    if (tooBigMatch) {
      translated = `quá dài (tối đa ${tooBigMatch[1]} ký tự)`;
    } else if (/^Required/i.test(rawMessage)) {
      translated = 'không được để trống';
    } else if (/^Invalid url/i.test(rawMessage)) {
      translated = 'đường dẫn URL không hợp lệ';
    } else if (/^Invalid email/i.test(rawMessage)) {
      translated = 'email không hợp lệ';
    } else if (/^Invalid uuid/i.test(rawMessage)) {
      translated = 'mã định danh không hợp lệ';
    }
  }

  if (!FIELD_LABELS[field] && translated === rawMessage) {
    return `${field}: ${rawMessage}`;
  }

  return `${label}: ${translated}`;
}

/** Gộp tối đa `maxFields` lỗi theo field (`error.fields`) thành các dòng tiếng Việt; không có thì trả `undefined`. */
export const formatApiErrorFields = (error: unknown, maxFields: number = 3): string | undefined => {
  const fields = getApiErrorFields(error);
  if (!fields) return undefined;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    const rawMessages = Array.isArray(value) ? value.map((v) => String(v)).join(', ') : String(value);
    parts.push(localizeFieldValidation(key, rawMessages));
    if (parts.length >= maxFields) break;
  }
  if (parts.length === 0) return undefined;
  const extra = Object.keys(fields).length - parts.length;
  return extra > 0 ? [...parts, `... và ${extra} lỗi khác`].join('\n') : parts.join('\n');
};

/** Message chính của BE kèm các dòng lỗi theo field (nếu có) — dùng cho Alert/thông báo lỗi form. */
export const getApiErrorDetail = (error: unknown, fallbackMessage?: string): string => {
  const message = getApiErrorMessage(error, fallbackMessage);
  const fields = formatApiErrorFields(error);
  return fields ? `${message}\n${fields}` : message;
};
