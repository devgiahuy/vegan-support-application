import { DietPattern, RestaurantWeekday } from '@/common/enums';
import { DEFAULT_RADIUS_M } from '../schemas/restaurant.schema';
import { isBoundsUsable } from './restaurant-bounds';
import type {
  RestaurantAdvancedFilters,
  RestaurantSearchMode,
  RestaurantSearchState,
} from '../types/restaurant.model';

/**
 * Logic thuần của phiên tìm kiếm: chế độ tìm, đếm bộ lọc, và phần dữ liệu được phép nhớ giữa các lần mở trang.
 *
 * Ràng buộc bảo mật (FR-029): `sanitizePersistedFilters` là ĐIỂM CHẶN DUY NHẤT giữa dữ liệu phiên
 * và tọa độ người dùng. Bất cứ field nào mang thông tin vị trí đều phải bị loại khỏi kết quả.
 *
 * File này KHÔNG import React để có thể test trong môi trường node.
 */

/** Số ký tự tối thiểu để chế độ tìm theo từ khóa được kích hoạt (contract: `q` min 2). */
export const MIN_KEYWORD_LENGTH = 2;

/** Bộ lọc rỗng, dùng làm mặc định và để xoá sạch nhanh. */
export const EMPTY_FILTERS: RestaurantAdvancedFilters = {};

/**
 * Xác định chế độ tìm kiếm hiện hành.
 *
 * Trả `null` khi **không được phép** gửi truy vấn:
 * - Chưa có vị trí nào (không có `lat`/`lng` cặp và không có bounds dùng được).
 * - `lat` và `lng` chỉ có một trong hai — backend yêu cầu phải đi cùng nhau.
 *
 * Thứ tự ưu tiên: KEYWORD > BOUNDS > NEARBY.
 */
export function resolveSearchMode(
  state: Partial<RestaurantSearchState> | null | undefined
): RestaurantSearchMode | null {
  if (!state) return null;

  const hasKeyword =
    typeof state.query === 'string' && state.query.trim().length >= MIN_KEYWORD_LENGTH;
  if (hasKeyword) return 'KEYWORD';

  const lat = state.lat;
  const lng = state.lng;
  const hasLat = typeof lat === 'number' && !Number.isNaN(lat);
  const hasLng = typeof lng === 'number' && !Number.isNaN(lng);

  if (hasLat !== hasLng) return null;

  if (isBoundsUsable(state.bounds)) return 'BOUNDS';

  if (hasLat && hasLng) return 'NEARBY';

  return null;
}

/** Đếm số bộ lọc nâng cao đang bật — dùng cho badge trên nút mở hộp lọc. */
export function countActiveAdvancedFilters(
  filters: RestaurantAdvancedFilters | null | undefined
): number {
  if (!filters) return 0;
  const keys: (keyof RestaurantAdvancedFilters)[] = [
    'minPrice',
    'maxPrice',
    'minRating',
    'openState',
    'openOnDay',
    'openAtHour',
  ];
  return keys.reduce((count, key) => {
    const value = filters[key];
    return value === undefined || value === null ? count : count + 1;
  }, 0);
}

/**
 * Loại bỏ mọi dữ liệu vị trí khỏi state trước khi ghi vào bộ nhớ phiên (FR-029/FR-030).
 *
 * CHỈ giữ lại: từ khóa, bán kính, trường phái ăn và 6 bộ lọc nâng cao.
 * CHỈ loại bỏ: `lat`, `lng`, `bounds`, `locationSource`, `locationConsent` và mọi field
 * lạ lẫn vào từ dữ liệu phiên cũ.
 */
export function sanitizePersistedFilters(
  raw: unknown
): Pick<RestaurantSearchState, 'radiusM' | 'query' | 'dietPattern' | 'advanced'> {
  const empty = {
    radiusM: DEFAULT_RADIUS_M,
    query: '',
    dietPattern: undefined,
    advanced: { ...EMPTY_FILTERS },
  };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return empty;

  const source = raw as Record<string, unknown>;

  const radiusM =
    typeof source.radiusM === 'number' && Number.isFinite(source.radiusM)
      ? source.radiusM
      : DEFAULT_RADIUS_M;

  const query = typeof source.query === 'string' ? source.query.slice(0, 160) : '';

  const dietPattern =
    source.dietPattern === DietPattern.VEGAN || source.dietPattern === DietPattern.LACTO_OVO
      ? source.dietPattern
      : undefined;

  return { radiusM, query, dietPattern, advanced: sanitizeAdvancedFilters(source.advanced) };
}

/** Lọc và kiểm tra 6 trường lọc nâng cao theo đúng ràng buộc contract. */
export function sanitizeAdvancedFilters(raw: unknown): RestaurantAdvancedFilters {
  const result: RestaurantAdvancedFilters = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  const source = raw as Record<string, unknown>;

  const price = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 4
      ? value
      : undefined;
  const minPrice = price(source.minPrice);
  if (minPrice !== undefined) result.minPrice = minPrice;
  const maxPrice = price(source.maxPrice);
  if (maxPrice !== undefined) result.maxPrice = maxPrice;

  if (
    typeof source.minRating === 'number' &&
    Number.isFinite(source.minRating) &&
    source.minRating >= 2 &&
    source.minRating <= 4.5
  ) {
    result.minRating = source.minRating;
  }

  if (source.openState === 'now' || source.openState === '24h') {
    result.openState = source.openState;
  }

  const days: readonly string[] = Object.values(RestaurantWeekday);
  if (typeof source.openOnDay === 'string' && days.includes(source.openOnDay)) {
    result.openOnDay = source.openOnDay as RestaurantAdvancedFilters['openOnDay'];
  }

  if (
    typeof source.openAtHour === 'number' &&
    Number.isInteger(source.openAtHour) &&
    source.openAtHour >= 0 &&
    source.openAtHour <= 23
  ) {
    result.openAtHour = source.openAtHour;
  }

  return result;
}

/** Nội dung trạng thái rỗng và các hành động gợi ý, tùy theo chế độ tìm hiện tại. */
export function emptyStateCopy(mode: RestaurantSearchMode | null): {
  title: string;
  description: string;
  actions: string[];
} {
  if (mode === 'KEYWORD') {
    return {
      title: 'Không tìm thấy quán phù hợp',
      description: 'Thử bỏ bớt bộ lọc nâng cao, xoá từ khóa hoặc mở rộng bán kính tìm kiếm.',
      actions: ['Xoá bộ lọc nâng cao', 'Xoá từ khóa', 'Nới bán kính', 'Đổi vị trí'],
    };
  }
  if (mode === 'BOUNDS') {
    return {
      title: 'Không có quán trong vùng bạn đang xem',
      description: 'Hãy thu phóng bản đồ ra rộng hơn rồi bấm "Tìm trong vùng đang xem" lại.',
      actions: ['Đổi vị trí'],
    };
  }
  return {
    title: 'Chưa tìm thấy quán chay quanh đây',
    description: 'Thử mở rộng bán kính tìm kiếm hoặc đổi sang khu vực khác.',
    actions: ['Nới bán kính', 'Đổi vị trí'],
  };
}
