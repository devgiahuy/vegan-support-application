import type { LocationQuery, Restaurant } from '../types/restaurant.model';

/**
 * Tên nguồn dữ liệu quán (contract §1, §4 — spec 018 FR-010/FR-011).
 * Mọi provider (Google thật, giả, Backend tương lai) tuân cùng chữ ký;
 * queries/components không đổi khi đổi nguồn (SC-004).
 */
export type PlaceProviderName = 'google' | 'mock';

/** Lỗi mức ứng dụng — UI chỉ thấy mã này, KHÔNG thấy chi tiết kỹ thuật của nguồn ngoài (FR-008). */
export enum PlaceErrorCode {
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  SEARCH_FAILED = 'SEARCH_FAILED',
  PLACE_NOT_FOUND = 'PLACE_NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
}

/** Thông báo tiếng Việt tương ứng từng mã lỗi (FR-008). */
export const PLACE_ERROR_MESSAGES: Record<PlaceErrorCode, string> = {
  [PlaceErrorCode.LOCATION_UNAVAILABLE]: 'Không lấy được vị trí. Nhập địa chỉ để tiếp tục nhé.',
  [PlaceErrorCode.SEARCH_FAILED]: 'Không tải được quán gần đây, thử lại nhé.',
  [PlaceErrorCode.PLACE_NOT_FOUND]: 'Quán này không còn hiển thị.',
  [PlaceErrorCode.RATE_LIMITED]: 'Đang quá tải, giữ kết quả hiện tại và thử lại sau nhé.',
  [PlaceErrorCode.PROVIDER_UNAVAILABLE]: 'Bản đồ tạm lỗi, danh sách bên dưới vẫn đầy đủ nhé.',
};

/** Lỗi provider ném ra — luôn mang mã ứng dụng, giữ lỗi gốc để debug (không hiện UI). */
export class PlaceProviderError extends Error {
  readonly code: PlaceErrorCode;

  constructor(code: PlaceErrorCode, cause?: unknown) {
    super(PLACE_ERROR_MESSAGES[code]);
    this.name = 'PlaceProviderError';
    this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * Điểm trừu tượng nguồn dữ liệu (tài liệu kiến trúc §8).
 * Trả về khái niệm Quán chung của VeggieConnect — KHÔNG trả dữ liệu thô (FR-006).
 */
export interface PlaceProvider {
  readonly name: PlaceProviderName;
  searchNearby(query: LocationQuery): Promise<Restaurant[]>;
  search(query: LocationQuery): Promise<Restaurant[]>;
  getDetails(providerId: string): Promise<Restaurant | null>;
  geocode(address: string): Promise<{ lat: number | null; lng: number | null; label: string }>;
}

/**
 * Chọn nguồn theo env (contract §4): `google` khi có key trình duyệt (hoặc cấu hình google),
 * `mock` khi cấu hình rõ ràng là mock hoặc khi thiếu key.
 */
export function resolveProviderName(): PlaceProviderName {
  const configured = (process.env.NEXT_PUBLIC_PLACE_PROVIDER ?? process.env.PLACE_PROVIDER ?? '')
    .trim()
    .toLowerCase();
  const hasKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim().length > 0;
  if (configured === 'mock') return 'mock';
  if (hasKey || configured === 'google') return 'google';
  return 'mock';
}
