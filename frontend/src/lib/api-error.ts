import { AxiosError } from 'axios';
import { ErrorResponse } from '@/types/api';
import { toast } from 'sonner';

/**
 * Type guard to check if an unknown error is an AxiosError.
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
 * Checks if the error is a network error (no response received).
 */
export const isNetworkError = (error: unknown): boolean => {
  if (isAxiosError(error)) {
    return !error.response && !!error.request;
  }
  return false;
};

/**
 * Gets the HTTP status code from an API error response.
 */
export const getApiErrorStatus = (error: unknown): number | undefined => {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
};

/**
 * Gets the raw error data payload from an API error response.
 */
export const getApiErrorData = (error: unknown): ErrorResponse | undefined => {
  if (isAxiosError(error)) {
    return error.response?.data;
  }
  return undefined;
};

/**
 * Reads the backend business error code (`error.code`, nested envelope).
 * Always branch on this code, never on message text.
 */
export const getApiErrorCode = (error: unknown): string | undefined => {
  const data = getApiErrorData(error);
  if (!data) return undefined;
  const nested = data.error?.code;
  if (typeof nested === 'string' && nested.length > 0) return nested;
  return undefined;
};

/**
 * Reads per-field validation errors (`error.fields`, nested envelope).
 */
export const getApiErrorFields = (error: unknown): Record<string, unknown> | undefined => {
  const data = getApiErrorData(error);
  const fields = data?.error?.fields;
  if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
    return fields as Record<string, unknown>;
  }
  return undefined;
};

/**
 * Extracts a user-friendly error message from an API error response.
 */
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
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.';
    }
  } else if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
};

/**
 * Handles API errors by showing a toast, avoiding duplicates with Axios global handler.
 */
export const handleApiError = (error: unknown, fallbackMessage?: string) => {
  const status = getApiErrorStatus(error);
  const isNetwork = isNetworkError(error);

  // Skip global codes that are already handled in Axios interceptor
  if (
    isNetwork ||
    (status && (status >= 500 || status === 403 || status === 429 || status === 401))
  ) {
    return;
  }

  const msg = getApiErrorMessage(error, fallbackMessage);
  if (msg) {
    toast.error(msg);
  }
};
