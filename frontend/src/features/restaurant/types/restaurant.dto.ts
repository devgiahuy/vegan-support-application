/**
 * DTO restaurants/location (Theo đặc tả Phase 24 và data-model.md).
 * Tuân thủ quy chuẩn Backend Integration.
 */

/** Quán chay (thô từ API backend). */
export interface RestaurantDto {
  id?: string;
  name?: string;
  address?: string;
  lat?: number | string | null;
  lng?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  distanceM?: number | string | null;
  distance_m?: number | string | null;
  distanceMeters?: number | string | null;
  dietaryTags?: (string | null)[] | null;
  dietTags?: (string | null)[] | null;
  dishes?: (string | null)[] | null;
  openingHours?: string | null;
  opening_hours?: string | null;
  operatingHours?: Record<string, string> | string | null;
  priceRange?: string | null;
  price_range?: string | null;
  phoneNumber?: string | null;
  phone_number?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  website_url?: string | null;
  website?: string | null;
  source?: string; // 'INTERNAL' | 'GOOGLE_PLACES'
  fetchedAt?: string | null;
  fetched_at?: string | null;
  status?: string; // 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED'
  submittedBy?: { id?: string; displayName?: string } | null;
}

/** `GET /restaurants/nearby` hoặc `GET /restaurants/search` → danh sách + meta. */
export interface RestaurantListResponseDto {
  success?: boolean;
  data?: (RestaurantDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
    externalDataUnavailable?: boolean;
  } | null;
}

/** `GET /restaurants/:id` → thông tin chi tiết quán. */
export interface RestaurantResponseDto {
  success?: boolean;
  data?: RestaurantDto | null;
  meta?: null;
}

/** `POST /restaurants` — đề xuất quán mới do Thành viên gửi. */
export interface SubmitRestaurantRequestDto {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  dietaryTags?: string[];
  dishes?: string[];
  openingHours?: string;
  priceRange?: string;
  phoneNumber?: string;
  note?: string;
}

/** `POST /restaurants` → phản hồi sau khi gửi đề xuất quán. */
export interface SubmitRestaurantResponseDto {
  success?: boolean;
  data?: RestaurantDto | null;
  meta?: null;
}

/** `GET /location/geocode` → phản hồi chuyển đổi địa chỉ thành tọa độ. */
export interface GeocodeResponseDto {
  success?: boolean;
  data?: {
    lat?: number | string | null;
    lng?: number | string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    label?: string;
    address?: string;
  } | null;
  meta?: null;
  externalDataUnavailable?: boolean;
}

/** Đơn chờ duyệt quán ăn (Admin queue). */
export type RestaurantSubmissionDto = RestaurantDto;

/** `GET /admin/restaurants` → danh sách quán chờ duyệt + meta. */
export interface AdminRestaurantListResponseDto {
  success?: boolean;
  data?: (RestaurantSubmissionDto | null)[] | null;
  meta?: RestaurantListResponseDto['meta'];
}

/** `PATCH /admin/restaurants/:id/review` — yêu cầu phê duyệt hoặc từ chối quán. */
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
