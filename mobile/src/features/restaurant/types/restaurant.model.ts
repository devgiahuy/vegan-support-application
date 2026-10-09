/** Chế độ ăn dùng làm bộ lọc cứng ở backend (`dietPattern`). */
export type RestaurantDietPattern = 'VEGAN' | 'LACTO_OVO';

/** Thứ trong tuần dạng khóa 3 ký tự (contract `openOnDay`). */
export type RestaurantWeekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/**
 * Bộ lọc nâng cao — backend chỉ nhận ở `GET /restaurants/search`, nên chỉ có hiệu lực khi tìm theo từ khóa.
 * Giá là thang 4 mức của nhà cung cấp (0..4), KHÔNG phải số tiền VND.
 */
export interface RestaurantAdvancedFilters {
  minPrice?: number;
  maxPrice?: number;
  /** 2..4.5 */
  minRating?: number;
  openState?: 'now' | '24h';
  openOnDay?: RestaurantWeekday;
  /** 0..23 */
  openAtHour?: number;
}

/** Nguồn vị trí gửi lên backend: nhập tay/địa chỉ hay lấy từ thiết bị (cần đồng ý). */
export type LocationSource = 'MANUAL' | 'DEVICE';

export interface RestaurantOpeningHour {
  dayLabel: string;
  hours: string;
}

/** Địa điểm hiển thị cho người dùng. */
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  categories: string[];
  rating: number | null;
  reviewCount: number | null;
  /** Mức giá nguyên văn từ nhà cung cấp (ví dụ `$$`), null khi không có. */
  price: string | null;
  /** Trạng thái mở cửa nguyên văn từ nhà cung cấp, null khi không có. */
  openState: string | null;
  openingHours: RestaurantOpeningHour[];
  phone: string | null;
  website: string | null;
  thumbnailUrl: string | null;
  mapsUrl: string | null;
  dietTags: string[];
  dietTagLabels: string[];
  /** Chế độ ăn đã được quản trị viên xác minh hay mới chỉ là khớp từ khóa của nhà cung cấp. */
  dietaryReviewed: boolean;
  source: string;
  sourceLabel: string;
  /** Câu ghi nguồn bắt buộc hiển thị khi dùng dữ liệu bên ngoài. */
  attribution: string;
  fetchedAt: Date | null;
  /** Dữ liệu cũ hơn 30 ngày, cần cảnh báo người dùng. */
  isStale: boolean;
  distanceM: number | null;
  /** `850 m`, `2,3 km`, rỗng khi chưa có vị trí. */
  distanceLabel: string;
  matchReasonLabels: string[];
}

export interface RestaurantDiscoveryMeta {
  page: number;
  limit: number;
  total: number;
  resultsTruncated: boolean;
  /** Nhà cung cấp bản đồ ngoài không khả dụng, chỉ có dữ liệu nội bộ. */
  externalDataUnavailable: boolean;
}

export interface RestaurantDiscoveryResult {
  items: Restaurant[];
  meta: RestaurantDiscoveryMeta;
}

/** Truy vấn khám phá quán gần vị trí. */
export interface LocationQuery {
  lat: number;
  lng: number;
  /** Mặc định 5000, giới hạn 100–50000. */
  radiusM: number;
  /** Từ khóa món/tên quán; chỉ gọi `search` khi có từ 2 ký tự. */
  query: string;
  dietPattern?: RestaurantDietPattern;
  /** Chỉ được gửi khi `query` đủ dài để gọi `search`. */
  advanced?: RestaurantAdvancedFilters;
  source: LocationSource;
}

export interface GeocodeLocation {
  lat: number;
  lng: number;
  label: string;
  attribution: string;
  /** Nhà cung cấp ngoài không khả dụng — tọa độ có thể chỉ là dữ liệu dự phòng. */
  externalDataUnavailable: boolean;
}

export type SubmittedRestaurantStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Quán do chính người dùng đề xuất (kèm trạng thái duyệt). */
export interface SubmittedRestaurant {
  id: string;
  name: string;
  address: string;
  categories: string[];
  dietTagLabels: string[];
  status: SubmittedRestaurantStatus;
  statusLabel: string;
  reviewReason: string | null;
  createdAt: Date | null;
  reviewedAt: Date | null;
}

export interface SubmittedRestaurantListResult {
  items: SubmittedRestaurant[];
  total: number;
}

/** Dữ liệu form đề xuất quán (tọa độ bắt buộc theo backend). */
export interface SubmitRestaurantInput {
  name: string;
  address: string;
  lat: number;
  lng: number;
  categories: string[];
  dietTags: string[];
}
