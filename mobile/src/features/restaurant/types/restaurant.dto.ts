/**
 * DTO restaurants/location — khớp OpenAPI backend (`RestaurantDiscoveryResponse`, `RestaurantPlaceResponse`,
 * `RestaurantAdminListResponse`, `LocationGeocodeResponse`, body `POST /restaurants`).
 */

/** Một địa điểm (nội bộ đã duyệt hoặc từ nhà cung cấp bản đồ) — `nearby`, `search`, `:id`. */
export interface RestaurantPlaceDto {
  id?: string;
  name?: string;
  address?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  categories?: (string | null)[] | null;
  rating?: number | null;
  reviewCount?: number | null;
  price?: string | null;
  openState?: string | null;
  operatingHours?: Record<string, string> | null;
  phone?: string | null;
  website?: string | null;
  thumbnailUrl?: string | null;
  mapsUrl?: string | null;
  dietTags?: (string | null)[] | null;
  source?: string;
  externalPlaceId?: string | null;
  attribution?: string;
  fetchedAt?: string | null;
  distanceMeters?: number | null;
  matchReasons?: (string | null)[] | null;
  dietaryReviewed?: boolean;
}

export interface RestaurantDiscoveryMetaDto {
  page?: number;
  limit?: number;
  total?: number;
  resultsTruncated?: boolean;
  externalDataUnavailable?: boolean;
  provider?: string;
  providerResultLimit?: number;
  locationStored?: boolean;
}

/** `GET /restaurants/nearby` và `GET /restaurants/search`. */
export interface RestaurantDiscoveryResponseDto {
  success?: boolean;
  data?: (RestaurantPlaceDto | null)[] | null;
  meta?: RestaurantDiscoveryMetaDto | null;
}

/** `GET /restaurants/:id`. */
export interface RestaurantPlaceResponseDto {
  success?: boolean;
  data?: RestaurantPlaceDto | null;
}

/** Bản ghi quán do thành viên đề xuất — `POST /restaurants`, `GET /restaurants/mine`. */
export interface RestaurantRecordDto {
  id?: string;
  name?: string;
  address?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  categories?: (string | null)[] | null;
  dietTags?: (string | null)[] | null;
  allergenFreeCodes?: (string | null)[] | null;
  excludedIngredients?: (string | null)[] | null;
  source?: string;
  status?: string;
  reviewedAt?: string | null;
  reviewReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** `POST /restaurants`. */
export interface RestaurantRecordResponseDto {
  success?: boolean;
  data?: RestaurantRecordDto | null;
}

/** `GET /restaurants/mine`. */
export interface RestaurantRecordListResponseDto {
  success?: boolean;
  data?: (RestaurantRecordDto | null)[] | null;
  meta?: { page?: number; limit?: number; total?: number } | null;
}

/** Body `POST /restaurants` (backend `strict`, không nhận field lạ). */
export interface SubmitRestaurantRequestDto {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  categories: string[];
  dietTags: string[];
}

/** `GET /location/geocode`. */
export interface LocationGeocodeResponseDto {
  success?: boolean;
  data?: {
    address?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    placeId?: string | null;
    attribution?: string;
  } | null;
  externalDataUnavailable?: boolean;
}
