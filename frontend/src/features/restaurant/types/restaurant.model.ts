import type { RestaurantStatus, RestaurantSource } from '@/common/enums';

/** Quán chay dùng cho UI (Model sạch). */
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  /** null khi chưa có vị trí để tính khoảng cách. */
  distanceM: number | null;
  /** Chuỗi hiển thị khoảng cách thân thiện: `850 m`, `2,3 km`, rỗng khi null. */
  distanceLabel: string;
  /** Danh sách nhãn trường phái ăn chay (ví dụ: 'Thuần chay', 'Chay có sữa'). */
  dietaryTags: string[];
  /** Danh sách món ăn tiêu biểu. */
  dishes: string[];
  /** Chuỗi giờ mở cửa / đóng cửa. */
  openingHours: string | null;
  /** Khoảng giá ước tính (ví dụ: '25.000đ - 60.000đ'). */
  priceRange: string | null;
  /** Số điện thoại liên hệ (nếu có). */
  phoneNumber: string | null;
  /** Trang web hoặc fanpage của quán. */
  websiteUrl: string | null;
  /** Nguồn dữ liệu ('INTERNAL' | 'GOOGLE_PLACES'). */
  source: RestaurantSource;
  /** Nhãn nguồn hiển thị ('Cộng đồng VeggieConnect' | 'Google Places'). */
  sourceLabel: string;
  attribution: string;
  dietaryReviewed: boolean;
  rating: number | null;
  /** Thời điểm cập nhật dữ liệu gần nhất. */
  fetchedAt: Date | null;
  /** Cờ báo dữ liệu cũ (> 30 ngày) cần cảnh báo thân thiện. */
  isStale: boolean;
  /** Trạng thái kiểm duyệt. */
  status: RestaurantStatus;
  /** Nhãn trạng thái tiếng Việt. */
  statusLabel: string;
  /** Tên thành viên đề xuất quán. */
  submittedByName: string | null;
}

/** Input gửi quán mới từ giao diện người dùng. */
export interface SubmitRestaurantInput {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  dietaryTags?: string[];
  dishes: string[];
  openingHours?: string;
  priceRange?: string;
  phoneNumber?: string;
  note?: string;
}

/** Tọa độ và nhãn vị trí geocoding. */
export interface GeocodeLocation {
  lat: number;
  lng: number;
  label: string;
}

/** Truy vấn vị trí và bộ lọc tìm kiếm quán chay. */
export interface LocationQuery {
  lat?: number;
  lng?: number;
  addressText?: string;
  /** Mặc định 5000, giới hạn 500–50000m. */
  radiusM: number;
  /** Từ khóa tên quán hoặc món ăn. */
  query?: string;
  /** Danh sách trường phái ăn chay lọc cứng (ví dụ: ['VEGAN']). */
  dietaryTags?: string[];
  locationSource?: 'MANUAL' | 'DEVICE';
  locationConsent?: boolean;
  page?: number;
  limit?: number;
}

export interface RestaurantDiscovery {
  items: Restaurant[];
  metadata: import('@/types/api').PaginationMetadata;
  externalDataUnavailable: boolean;
  externalResultsSuppressed: boolean;
  resultsTruncated: boolean;
}

/** Bộ lọc tìm kiếm quán ăn. */
export interface RestaurantFilter {
  query: string;
  radiusM: number;
  dietaryTags: string[];
}

/** Hành động duyệt quán của Admin. */
export interface RestaurantReviewAction {
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}
