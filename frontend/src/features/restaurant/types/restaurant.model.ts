import type {
  DietPattern,
  RestaurantOpenState,
  RestaurantSource,
  RestaurantStatus,
} from '@/common/enums';

/**
 * Quán chay — UI Model sạch. Component CHỈ được đọc file này, tuyệt đối không đọc DTO.
 * Mọi nhãn hiển thị và giá trị đã định dạng đều được mapper chuẩn bị sẵn ở đây
 * (không format trong JSX — `docs/ARCHITECTURE.md` §4).
 */
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  /** `true` khi có đủ tọa độ để vẽ lên bản đồ. */
  hasCoordinates: boolean;

  /** null khi không có dữ liệu khoảng cách. */
  distanceM: number | null;
  /** Chuỗi hiển thị khoảng cách: `850 m`, `2,3 km`, rỗng khi null. */
  distanceLabel: string;

  /** Mã nhãn chế độ ăn (ví dụ `VEGAN`). */
  dietaryTags: string[];
  /** Nhãn tiếng Việt đã dịch, cùng thứ tự với `dietaryTags`. */
  dietaryTagLabels: string[];
  /** Món tiêu biểu; có thể rỗng vì backend không còn trả field này. */
  dishes: string[];

  /** Chuỗi giờ mở cửa đã ghép để hiển thị tức. */
  openingHours: string | null;
  /** Giờ mở cửa theo từng ngày, ví dụ `{ monday: '08:00-22:00' }`. */
  operatingHoursByDay: Record<string, string>;

  /** Khoảng giá dạng chuỗi của provider (ví dụ `"$$"`); có thể null. */
  priceLabel: string | null;
  phoneNumber: string | null;
  websiteUrl: string | null;
  /** Ảnh đại diện của quán. */
  thumbnailUrl: string | null;
  /** Link mở bản đồ tới quán. */
  mapsUrl: string | null;

  /** Điểm đánh giá; null khi provider không có. */
  rating: number | null;
  /** `4,5` hoặc rỗng khi chưa có đánh giá. */
  ratingLabel: string;
  /** `128 đánh giá` hoặc rỗng. */
  reviewCountLabel: string;

  openState: RestaurantOpenState | null;
  /** `Đang mở` / `Mở 24h` / rỗng. */
  openStateLabel: string;

  source: RestaurantSource;
  /** Nhãn nguồn tiếng Việt. */
  sourceLabel: string;
  /** `true` khi dữ liệu đến từ nhà cung cấp bên ngoài (không phải quán nội bộ đã duyệt). */
  isExternal: boolean;
  /** Nghĩa vụ ghi nhận nguồn; bắt buộc hiển thị với dữ liệu bên ngoài. */
  attribution: string;
  /** `true` khi chế độ ăn đã được người kiểm duyệt xác nhận. */
  dietaryReviewed: boolean;
  /** Điều kiện bắt buộc hiển thị cảnh báo giới hạn dữ liệu chế độ ăn (FR-009). */
  requiresDietaryWarning: boolean;
  /** Lý do khớp từ nhà cung cấp. */
  matchReasons: string[];

  fetchedAt: Date | null;
  /** `true` khi dữ liệu quá 30 ngày chưa cập nhật. */
  isStale: boolean;

  /** Trạng thái kiểm duyệt — chỉ dùng cho màn hình quản trị (ngoài phạm vi redesign). */
  status: RestaurantStatus;
  statusLabel: string;
  /** Tên thành viên đề xuất quán — chỉ dùng cho màn hình quản trị. */
  submittedByName: string | null;
}

/** Loại cảnh báo hiển thị trên đầu danh sách kết quả. */
export type DiscoveryNoticeKind = 'UNAVAILABLE' | 'SUPPRESSED' | 'TRUNCATED' | 'ATTRIBUTION' | 'STALE' | 'PRIVACY';

/** Một cảnh báo đã dịch sẵn — nội dung lấy thẳng từ `message`, không format trong JSX. */
export interface DiscoveryNotice {
  kind: DiscoveryNoticeKind;
  message: string;
  tone: 'info' | 'warning';
}

/** Metadata phân trang + trạng thái nhà cung cấp của một lần tìm kiếm. */
export interface RestaurantDiscoveryMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  /** `true` khi không có nguồn provider nào phản hồi thành công. */
  externalDataUnavailable: boolean;
  externalResultsSuppressed: boolean;
  /** `true` khi kết quả bị cắt bởi giới hạn nhà cung cấp. */
  resultsTruncated: boolean;
  provider: string;
  providerLabel: string;
  providerResultLimit: number | null;
  /** Backend luôn trả `false`; dùng để khẳng định vị trí người dùng không được lưu giữ. */
  locationStored: boolean;
}

/** Kết quả một lần khám phá quán chay — thay cho `PaginationResult<Restaurant>`. */
export interface RestaurantDiscoveryResult {
  restaurants: Restaurant[];
  meta: RestaurantDiscoveryMeta;
  /** Cảnh báo đã dịch sẵn; rỗng khi không có gì cần cảnh báo. */
  notices: DiscoveryNotice[];
}

/** Chế độ tìm kiếm: quanh một điểm, theo vùng bản đồ, hoặc theo từ khóa. */
export type RestaurantSearchMode = 'NEARBY' | 'BOUNDS' | 'KEYWORD';

/** Bộ lọc nâng cao — chỉ áp dụng ở chế độ tìm theo từ khóa. */
export interface RestaurantAdvancedFilters {
  /** 0..4, thang 4 mức của provider. KHÔNG phải số tiền VND. */
  minPrice?: number;
  maxPrice?: number;
  /** 2..4.5 */
  minRating?: number;
  openState?: 'now' | '24h';
  openOnDay?: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  openAtHour?: number;
}

/** Khung vùng bản đồ — backend yêu cầu đủ cả bốn mốc. */
export interface RestaurantBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** Nguồn vị trí: `DEVICE` bắt buộc kèm cờ đồng ý chia sẻ. */
export type RestaurantLocationSource = 'MANUAL' | 'DEVICE';

/** Toàn bộ state của một phiên tìm kiếm. Chỉ `lat`/`lng`/`bounds` mới là dữ liệu vị trí. */
export interface RestaurantSearchState {
  page?: number;
  limit?: number;
  mode: RestaurantSearchMode;
  lat?: number;
  lng?: number;
  bounds?: RestaurantBounds;
  /** 100..50000, mặc định 5000. */
  radiusM: number;
  /** Từ khóa món ăn/tên quán; ≥ 2 ký tự để vào chế độ KEYWORD. */
  query: string;
  /** Lọc cứng trường phái ăn. Chỉ nhận `VEGAN` | `LACTO_OVO`. */
  dietPattern?: DietPattern;
  advanced: RestaurantAdvancedFilters;
  locationSource?: RestaurantLocationSource;
  locationConsent?: boolean;
}

/** Kết quả phân giải địa chỉ. `isAvailable: false` nghĩa là không tìm được — KHÔNG thay bằng tọa độ mặc định. */
export interface RestaurantGeocodeResult {
  lat: number | null;
  lng: number | null;
  label: string;
  placeId: string | null;
  attribution: string;
  isAvailable: boolean;
}

/** Input gửi quán mới từ giao diện người dùng. */
export interface SubmitRestaurantInput {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  categories?: string[];
  dietTags?: string[];
  allergenFreeCodes?: string[];
  excludedIngredients?: string[];
}
