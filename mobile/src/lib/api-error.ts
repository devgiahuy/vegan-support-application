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
