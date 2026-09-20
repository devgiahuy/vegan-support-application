import type { RestaurantStatus } from '@/common/enums';

/** Quán chay dùng cho UI. */
export interface Restaurant {
  id: string;
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
  source: string;
  sourceLabel: string;
  status: RestaurantStatus;
  statusLabel: string;
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
