/**
 * DTO restaurants/location (SUY LUẬN — không có schema swagger, BE còn `PLANNED`).
 * Mọi field optional + `TODO(BE-READY)` reconfirm shape ở task nối live.
 * Envelope `{success, data, meta}` dùng trực tiếp khi nối live.
 */

/** Quán chay (thô, suy luận). */
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
  dishes?: (string | null)[] | null;
  openingHours?: string | null;
  opening_hours?: string | null;
  source?: string;
  fetchedAt?: string | null;
  fetched_at?: string | null;
  status?: string;
  submittedBy?: { id?: string; displayName?: string } | null;
}

/** `GET /restaurants/nearby|search` → mảng + meta. */
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

/** `GET /restaurants/:id` → 1 quán. */
export interface RestaurantResponseDto {
  success?: boolean;
  data?: RestaurantDto | null;
  meta?: null;
}

/** `POST /restaurants` — `name` + `address` bắt buộc. */
export interface SubmitRestaurantRequestDto {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  dishes?: string[];
  note?: string;
}

/** `GET /location/geocode` → tọa độ. */
export interface GeocodeResponseDto {
  success?: boolean;
  data?: { lat?: number | string | null; lng?: number | string | null; label?: string } | null;
  meta?: null;
}

/** Đơn chờ duyệt quán (thô, suy luận — dùng chung shape quán + submitter). */
export type RestaurantSubmissionDto = RestaurantDto;

/** `GET /admin/restaurants` → mảng chờ + meta. */
export interface AdminRestaurantListResponseDto {
  success?: boolean;
  data?: (RestaurantSubmissionDto | null)[] | null;
  meta?: RestaurantListResponseDto['meta'];
}

/** `PATCH /admin/restaurants/:id/review` — `APPROVE`/`REJECT` + `reason`. */
export interface ReviewRestaurantRequestDto {
  decision: string;
  reason: string;
}

/** `PATCH /admin/restaurants/:id/review` → quán sau duyệt. */
export interface ReviewRestaurantResponseDto {
  success?: boolean;
  data?: RestaurantDto | null;
  meta?: null;
}
