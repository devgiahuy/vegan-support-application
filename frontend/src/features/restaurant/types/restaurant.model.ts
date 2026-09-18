import type { PlaceDietType, PlaceOpeningStatus, RestaurantStatus } from '@/common/enums';

/** Ảnh quán (URL + dòng ghi nguồn, Q3 — thiếu attribution thì ẩn dòng ghi). */
export interface PlacePhoto {
  url: string;
  attribution: string | null;
}

/** Quán chay dùng cho UI. */
export interface Restaurant {
  id: string;
  /** Id gốc của nguồn (Google place id) — dùng `getDetails` (mới, spec 018). */
  providerId: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  /** null khi chưa có vị trí để tính. */
  distanceM: number | null;
  /** `850 m`, `2,3 km`, rỗng khi null. */
  distanceLabel: string;
  dishes: string[];
  openingHours: string | null;
  /** Thiếu dữ liệu → UNKNOWN + "Chưa rõ giờ mở cửa", KHÔNG đoán (mới, spec 018). */
  openingStatus: PlaceOpeningStatus;
  openingStatusLabel: string;
  /** Đánh giá 0–5, null khi thiếu → ẩn khối sao (mới, spec 018). */
  rating: number | null;
  /** Lượt đánh giá ≥ 0, null khi thiếu → ẩn (mới, spec 018). */
  reviewCount: number | null;
  /** Suy đoán mặc định UNKNOWN (mới, spec 018). */
  dietType: PlaceDietType;
  /**
   * Nhãn hiển thị: suy đoán luôn hạn định "Có thể phù hợp với người ăn chay"
   * (FR-007, SC-005); chỉ bỏ hạn định khi Backend/cộng đồng xác thực.
   */
  dietLabel: string;
  /** Ảnh kèm ghi nguồn; rỗng → placeholder (mới, spec 018, Q3). */
  photos: PlacePhoto[];
  /** Liên kết chỉ đường; thiếu → dùng địa chỉ text (mới, spec 018). */
  googleMapsUri: string | null;
  source: string;
  sourceLabel: string;
  fetchedAt: Date | null;
  /** true khi dữ liệu có thể cũ (quá 30 ngày). */
  isStale: boolean;
  status: RestaurantStatus;
  statusLabel: string;
  submittedByName: string | null;
}

/** Input gửi quán mới. */
export interface SubmitRestaurantInput {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  dishes: string[];
  note?: string;
}

/** Truy vấn vị trí: tọa độ HOẶC địa chỉ text (không gửi cả 2). */
export interface LocationQuery {
  lat?: number;
  lng?: number;
  addressText?: string;
  /** Mặc định 5000, giới hạn 500–50000. */
  radiusM: number;
  /** Từ món, rỗng = tất cả. */
  query: string;
}
