import type { RestaurantAdvancedFilters, RestaurantWeekday } from '../types/restaurant.model';

export const WEEKDAYS: readonly RestaurantWeekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function intInRange(value: unknown, min: number, max: number): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : undefined;
}

function numberInRange(value: unknown, min: number, max: number): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : undefined;
}

/**
 * Chỉ giữ giá trị nằm trong ràng buộc của backend (`minPrice`/`maxPrice` 0..4, `minRating` 2..4.5,
 * `openAtHour` 0..23, ...) để không bao giờ gửi tham số bị từ chối bằng 400.
 */
export function sanitizeAdvancedFilters(
  filters: RestaurantAdvancedFilters | null | undefined
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (!filters) return params;

  const minPrice = intInRange(filters.minPrice, 0, 4);
  if (minPrice !== undefined) params.minPrice = minPrice;
  const maxPrice = intInRange(filters.maxPrice, 0, 4);
  if (maxPrice !== undefined) params.maxPrice = maxPrice;
  const minRating = numberInRange(filters.minRating, 2, 4.5);
  if (minRating !== undefined) params.minRating = minRating;
  if (filters.openState === 'now' || filters.openState === '24h') params.openState = filters.openState;
  if (filters.openOnDay && WEEKDAYS.includes(filters.openOnDay)) params.openOnDay = filters.openOnDay;
  const openAtHour = intInRange(filters.openAtHour, 0, 23);
  if (openAtHour !== undefined) params.openAtHour = openAtHour;
  return params;
}

/** Số bộ lọc nâng cao đang bật (0..6). */
export function countActiveAdvancedFilters(filters: RestaurantAdvancedFilters | null | undefined): number {
  return Object.keys(sanitizeAdvancedFilters(filters)).length;
}

/** `null` khi hợp lệ, ngược lại là thông báo lỗi cho người dùng. */
export function validateAdvancedFilters(filters: RestaurantAdvancedFilters): string | null {
  if (
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.minPrice > filters.maxPrice
  ) {
    return 'Giá tối thiểu không được cao hơn giá tối đa.';
  }
  return null;
}
