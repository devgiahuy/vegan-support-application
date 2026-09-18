import type { LocationQuery, Restaurant } from '../types/restaurant.model';
import type { GooglePlaceDto } from '../types/restaurant.dto';
import { googlePlaceMapper } from '../mappers/google-place.mapper';
import { PlaceErrorCode, PlaceProviderError, type PlaceProvider } from './place-provider';
import { ensureMapsConfigured, importLibrary } from './maps-bootstrap';

/** Field mask tối thiểu — chỉ xin đúng trường UI cần để giảm billing (R2). */
const LIST_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'photos',
  'regularOpeningHours',
  'googleMapsUri',
  'types',
];

/** Cấu hình SDK 1 lần cho toàn app (dùng chung với bản đồ — xem maps-bootstrap). */
function ensureConfigured(): void {
  ensureMapsConfigured();
}

function toProviderError(err: unknown, fallback: PlaceErrorCode): PlaceProviderError {
  if (err instanceof PlaceProviderError) return err;
  const message = err instanceof Error ? err.message : String(err);
  if (/429|OVER_QUERY_LIMIT|quota|RESOURCE_EXHAUSTED/i.test(message)) {
    return new PlaceProviderError(PlaceErrorCode.RATE_LIMITED, err);
  }
  if (/REQUEST_DENIED|INVALID_REQUEST|API_KEY|referer/i.test(message)) {
    return new PlaceProviderError(PlaceErrorCode.PROVIDER_UNAVAILABLE, err);
  }
  return new PlaceProviderError(fallback, err);
}

function readLatLng(
  location: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined
): { latitude: number; longitude: number } | null {
  if (!location) return null;
  const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
  const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
  return typeof lat === 'number' && typeof lng === 'number'
    ? { latitude: lat, longitude: lng }
    : null;
}

/** Đọc thuộc tính SDK trong try/catch — getter thiếu field có thể ném lỗi. */
function readPlaceDto(place: google.maps.places.Place): GooglePlaceDto {
  const coords = readLatLng(place.location);
  let photos: GooglePlaceDto['photos'] = null;
  try {
    photos =
      place.photos?.map((photo) => {
        let url: string | null = null;
        try {
          url = photo.getURI({ maxWidth: 800, maxHeight: 800 });
        } catch {
          url = null;
        }
        const attribution =
          photo.authorAttributions
            ?.map((attr) => attr.displayName)
            .filter((name): name is string => typeof name === 'string' && name.length > 0)
            .join(', ') || null;
        return url ? { url, attribution } : null;
      }) ?? null;
  } catch {
    photos = null;
  }
  let openingHours: GooglePlaceDto['openingHours'] = null;
  try {
    openingHours = place.regularOpeningHours?.weekdayDescriptions ?? null;
  } catch {
    openingHours = null;
  }
  // @types hiện tại không có isOpen() tin cậy + thiếu múi giờ của quán để tự
  // tính → giữ UNKNOWN trung thực ("Chưa rõ giờ mở cửa", không đoán).
  return {
    id: place.id,
    displayName: place.displayName,
    formattedAddress: place.formattedAddress,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    photos,
    openingHours,
    openNow: null,
    googleMapsUri: place.googleMapsURI,
    types: place.types,
  };
}

/**
 * GooglePlaceProvider — nguồn Google Places (New) trực tiếp (FE-only, Q1).
 * Lọc chay là heuristic phía client trong mapper (FR-007) vì SearchNearby
 * không hỗ trợ lọc theo chế độ ăn phía server. Mọi response thô qua
 * `googlePlaceMapper` trước khi ra ngoài (FR-006).
 */
export class GooglePlaceProvider implements PlaceProvider {
  readonly name = 'google' as const;

  async searchNearby(query: LocationQuery): Promise<Restaurant[]> {
    try {
      ensureConfigured();
      if (query.lat === undefined || query.lng === undefined) {
        throw new PlaceProviderError(PlaceErrorCode.LOCATION_UNAVAILABLE);
      }
      const { Place } = await importLibrary('places');
      const { places } = await Place.searchNearby({
        fields: LIST_FIELDS,
        locationRestriction: {
          center: { lat: query.lat, lng: query.lng },
          radius: query.radiusM,
        },
        includedPrimaryTypes: ['restaurant'],
        maxResultCount: 20,
        language: 'vi',
      });
      return googlePlaceMapper.toModelList(places.map(readPlaceDto));
    } catch (err) {
      throw toProviderError(err, PlaceErrorCode.SEARCH_FAILED);
    }
  }

  async search(query: LocationQuery): Promise<Restaurant[]> {
    try {
      ensureConfigured();
      const textQuery = query.query.trim();
      if (textQuery.length === 0) return this.searchNearby(query);
      const { Place } = await importLibrary('places');
      const { places } = await Place.searchByText({
        fields: LIST_FIELDS,
        textQuery,
        locationBias:
          query.lat !== undefined && query.lng !== undefined
            ? { center: { lat: query.lat, lng: query.lng }, radius: query.radiusM }
            : undefined,
        maxResultCount: 20,
        language: 'vi',
      });
      return googlePlaceMapper.toModelList(places.map(readPlaceDto));
    } catch (err) {
      throw toProviderError(err, PlaceErrorCode.SEARCH_FAILED);
    }
  }

  async getDetails(providerId: string): Promise<Restaurant | null> {
    try {
      ensureConfigured();
      const { Place } = await importLibrary('places');
      const place = new Place({ id: providerId });
      await place.fetchFields({ fields: LIST_FIELDS });
      return googlePlaceMapper.toModel(readPlaceDto(place));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/NOT_FOUND|ZERO_RESULTS/i.test(message)) {
        throw new PlaceProviderError(PlaceErrorCode.PLACE_NOT_FOUND, err);
      }
      throw toProviderError(err, PlaceErrorCode.SEARCH_FAILED);
    }
  }

  async geocode(
    address: string
  ): Promise<{ lat: number | null; lng: number | null; label: string }> {
    try {
      ensureConfigured();
      const { Geocoder } = await importLibrary('geocoding');
      const response = await new Geocoder().geocode({ address, language: 'vi', region: 'VN' });
      const first = response.results[0];
      const coords = readLatLng(first?.geometry?.location);
      if (!coords) throw new PlaceProviderError(PlaceErrorCode.SEARCH_FAILED);
      return {
        lat: coords.latitude,
        lng: coords.longitude,
        label: first?.formatted_address ?? address,
      };
    } catch (err) {
      throw toProviderError(err, PlaceErrorCode.SEARCH_FAILED);
    }
  }
}
