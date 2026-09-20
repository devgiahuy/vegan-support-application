/**
 * DTO restaurants/location (SUY LUẬN — không có schema swagger, BE còn `PLANNED`).
 * Đồng bộ `frontend/src/features/restaurant/types/restaurant.dto.ts`. Mọi field optional.
 */
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
}

export interface RestaurantListResponseDto {
  success?: boolean;
  data?: (RestaurantDto | null)[] | null;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number } | null;
}

export interface GeocodeResponseDto {
  success?: boolean;
  data?: { lat?: number | string | null; lng?: number | string | null; label?: string } | null;
  meta?: null;
}
