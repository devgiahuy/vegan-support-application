import { isAxiosError, isNetworkError, getApiErrorStatus } from '@/lib/api-error';

export type ApiFallbackContext = 'list' | 'detail' | 'mutation';

/**
 * Quyết định có được rơi về dữ liệu mẫu (`__fixtures__`) hay phải ném lỗi thật.
 *
 * Backend `/posts` và `/uploads/signature` đang `PLANNED` nên fixture là hành vi
 * có chủ ý khi backend chưa tồn tại. Nhưng khi backend ĐÃ trả lời bằng lỗi
 * nghiệp vụ (4xx: VALIDATION_ERROR, FORBIDDEN, AUTH_REQUIRED...) thì phải
 * rethrow để UI hiển thị đúng, tuyệt đối không che bằng fixture + toast giả.
 *
 * - Lỗi mạng (không có response): fallback — BE chưa chạy hoặc mất mạng.
 * - 404 ở `list`: fallback — route chưa tồn tại khi endpoint còn PLANNED.
 * - 404 ở `detail`: KHÔNG fallback — resource không tồn tại, UI hiện trang 404.
 * - 4xx khác: KHÔNG fallback — lỗi nghiệp vụ/phân quyền thật, rethrow.
 * - 5xx / lỗi không phải HTTP: fallback để UI demo không sập.
 */
export function shouldFallbackToFixtures(error: unknown, context: ApiFallbackContext): boolean {
  if (isNetworkError(error)) return true;
  if (!isAxiosError(error)) return context !== 'mutation';
  const status = getApiErrorStatus(error);
  if (status === 404) return context === 'list';
  if (status !== undefined && status >= 400 && status < 500) return false;
  return true;
}

export interface NotFoundErrorOptions {
  resourceLabel?: string;
}

/**
 * Tạo lỗi 404 mang nhãn tài nguyên tiếng Việt cho trang detail.
 * React Query coi như `isError`, trang `[id]` render empty state thân thiện.
 */
export function createNotFoundError(options?: NotFoundErrorOptions): Error {
  const label = options?.resourceLabel ?? 'Nội dung';
  const error = new Error(`${label} không tồn tại hoặc đã bị gỡ khỏi hệ thống.`) as Error & {
    status?: number;
    code?: string;
  };
  error.status = 404;
  error.code = 'NOT_FOUND';
  return error;
}
