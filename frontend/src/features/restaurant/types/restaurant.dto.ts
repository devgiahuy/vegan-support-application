/**
 * DTO restaurants/location — dữ liệu THÔ từ Backend.
 *
 * Nguồn contract: `RestaurantDiscoveryResponse` / `RestaurantPlaceResponse` / `LocationGeocodeResponse`
 * trong `backend/src/modules/restaurants/restaurant.openapi.ts`, ràng buộc truy vấn trong
 * `restaurant.schemas.ts`. Chi tiết đối chiếu: `specs/006-restaurants-discovery-redesign/contracts/openapi-mismatch.md`.
 *
 * Quy tắc bắt buộc:
 * - Mọi field đều optional và chấp nhận `null`: backend có thể đổi tên hoặc thiếu field.
 * - Số chấp nhận `number | string` vì backend có thể trả số dạng chuỗi.
 * - Field có tiền tố tên contract là ưu tiên; tên cũ giữ làm alias để mapper thử theo thứ tự.
 * - Component KHÔNG được đọc file này — chỉ Mapper đọc DTO.
 */

/** Quán chay (thô từ API backend). */
export interface RestaurantDto {
  id?: string;
  name?: string;
  address?: string;

  /** Contract mới: tọa độ trả về dạng số (hoặc chuỗi ở bản ghi nội bộ). */
  latitude?: number | string | null;
  longitude?: number | string | null;
  /** Alias biến thể cũ. */
  lat?: number | string | null;
  lng?: number | string | null;

  /** Phân loại từ nhà cung cấp, ví dụ `['restaurant', 'vegan']`. */
  categories?: (string | null)[] | null;

  /** Điểm đánh giá; `null` khi provider không có. */
  rating?: number | string | null;
  /** Số lượt đánh giá; `null` khi provider không có. */
  reviewCount?: number | string | null;
  /** Khoảng giá dạng chuỗi của provider (ví dụ `"$"`, `"$$·$$$"`). KHÔNG phải số tiền. */
  price?: string | null;
  /** Trạng thái mở cửa: `'now'` | `'24h'`; `null` khi không có. */
  openState?: string | null;
  /** Giờ mở cửa theo từng ngày. */
  operatingHours?: Record<string, string> | null;

  phone?: string | null;
  /** URL website của quán. */
  website?: string | null;
  /** URL ảnh đại diện. */
  thumbnailUrl?: string | null;
  /** URL mở bản đồ tới quán. */
  mapsUrl?: string | null;

  /** Nhãn chế độ ăn theo contract mới. */
  dietTags?: (string | null)[] | null;
  /** Alias biến thể cũ. */
  dietaryTags?: (string | null)[] | null;

  /** `INTERNAL` | `GOOGLE` | `SERPAPI` | `FAKE`. */
  source?: string;
  /** Mã địa điểm ở nhà cung cấp bên ngoài; `null` với quán nội bộ. */
  externalPlaceId?: string | null;
  /** Nghĩa vụ ghi nhận nguồn — bắt buộc hiển thị với dữ liệu bên ngoài. */
  attribution?: string | null;
  /** ISO datetime thời điểm cập nhật dữ liệu. */
  fetchedAt?: string | null;

  /** Khoảng cách tới người dùng (mét) theo contract mới. */
  distanceMeters?: number | string | null;
  /** Alias biến thể cũ. */
  distanceM?: number | string | null;
  distance_m?: number | string | null;

  /** Lý do kết quả khớp tìm kiếm do nhà cung cấp trả về. */
  matchReasons?: (string | null)[] | null;
  /**
   * `true` khi chế độ ăn đã được người kiểm duyệt xác nhận.
   * Kết quả từ provider luôn là `false`: nhãn bên ngoài không chứng minh an toàn diet/allergy.
   */
  dietaryReviewed?: boolean | string | null;

  /** Món tiêu biểu. Backend không còn trả; giữ để không vỡ dữ liệu cũ. */
  dishes?: (string | null)[] | null;
  /** Alias biến thể cũ của giờ mở cửa dạng chuỗi. */
  openingHours?: string | null;
  opening_hours?: string | null;
  /** Alias biến thể cũ của khoảng giá. */
  priceRange?: string | null;
  price_range?: string | null;
  /** Alias biến thể cũ của điện thoại. */
  phoneNumber?: string | null;
  phone_number?: string | null;
  /** Alias biến thể cũ của website. */
  websiteUrl?: string | null;
  website_url?: string | null;

  /** Trạng thái kiểm duyệt — chỉ dùng cho màn hình quản trị. */
  status?: string;
  /** Người gửi đề xuất — chỉ dùng cho màn hình quản trị. */
  submittedBy?: { id?: string; displayName?: string } | null;
}

/** Meta phân trang + cảnh báo nhà cung cấp của `RestaurantDiscoveryResponse`. */
export interface RestaurantDiscoveryMetaDto {
  page?: number;
  limit?: number;
  total?: number;
  /** Backend không gửi 2 field này; giữ làm alias để mapper không gãy. */
  totalPages?: number;
  total_pages?: number;
  /** `true` khi kết quả bị cắt bởi giới hạn nhà cung cấp. */
  resultsTruncated?: boolean;
  /** `true` khi không có nguồn provider nào phản hồi thành công. */
  externalDataUnavailable?: boolean;
  /** `fake` | `google` | `serpapi`. */
  provider?: string;
  /** Trần số kết quả của provider (200 với SerpApi). */
  providerResultLimit?: number;
  /** Backend luôn trả `false`: vị trí người dùng không được lưu giữ. */
  locationStored?: boolean;
}

/** `GET /restaurants/nearby` hoặc `GET /restaurants/search` → danh sách + meta. Đã là envelope. */
export interface RestaurantListResponseDto {
  success?: boolean;
  data?: (RestaurantDto | null)[] | null;
  meta?: RestaurantDiscoveryMetaDto | null;
}

/** `GET /restaurants/:id` → thông tin chi tiết quán. */
export interface RestaurantResponseDto {
  success?: boolean;
  data?: RestaurantDto | null;
  meta?: null;
}

/**
 * `POST /restaurants` — đề xuất quán mới do Thành viên gửi.
 * Bám `submitRestaurantSchema` của backend (`.strict()`): sai tên field hoặc thêm field lạ đều bị 400.
 */
export interface SubmitRestaurantRequestDto {
  /** 2..180 ký tự. */
  name: string;
  /** 5..500 ký tự. */
  address: string;
  /** BẮT BUỘC, -90..90. */
  latitude: number;
  /** BẮT BUỘC, -180..180. */
  longitude: number;
  /** Tối đa 30 phần tử. */
  categories?: string[];
  /** Chỉ nhận `VEGAN` | `LACTO_OVO` | `BUDDHIST` | `CHRISTIAN`. */
  dietTags?: string[];
  allergenFreeCodes?: string[];
  excludedIngredients?: string[];
}

/** `POST /restaurants` → phản hồi sau khi gửi đề xuất quán. */
export interface SubmitRestaurantResponseDto {
  success?: boolean;
  data?: RestaurantDto | null;
  meta?: null;
}

/** Dữ liệu geocode của `GET /location/geocode`. */
export interface GeocodeDataDto {
  /** Tên địa chỉ đã phân giải (tên thật theo contract). */
  address?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  /** Alias biến thể cũ — contract không có. */
  lat?: number | string | null;
  lng?: number | string | null;
  label?: string;
  placeId?: string | null;
  attribution?: string;
}

/**
 * `GET /location/geocode?address=` → phản hồi chuyển địa chỉ thành tọa độ.
 * `data` là `null` khi provider lỗi; `externalDataUnavailable` nằm ở cấp envelope.
 */
export interface GeocodeResponseDto {
  success?: boolean;
  data?: GeocodeDataDto | null;
  externalDataUnavailable?: boolean;
}

/** Đơn chờ duyệt quán ăn (Admin queue). */
export type RestaurantSubmissionDto = RestaurantDto;

/** `GET /admin/restaurants` → danh sách quán chờ duyệt + meta. */
export interface AdminRestaurantListResponseDto {
  success?: boolean;
  data?: (RestaurantSubmissionDto | null)[] | null;
  meta?: RestaurantDiscoveryMetaDto | null;
}

/**
 * `PATCH /admin/restaurants/:id/review` — yêu cầu phê duyệt hoặc từ chối quán.
 * Ngoài phạm vi redesign trang khám phá: giữ nguyên shape hiện có để không đụng luồng quản trị.
 */
export interface ReviewRestaurantRequestDto {
  decision: 'APPROVE' | 'REJECT' | string;
  reason?: string;
}

/** `PATCH /admin/restaurants/:id/review` → kết quả sau khi duyệt. */
export interface ReviewRestaurantResponseDto {
  success?: boolean;
  data?: RestaurantDto | null;
  meta?: null;
}
