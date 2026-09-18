import { BaseMapper, pickField, safeArray, safeString } from '@/lib/mapper';
import { PlaceDietType, PlaceOpeningStatus, RestaurantStatus } from '@/common/enums';
import type { GooglePlaceDto, GooglePlacePhotoDto } from '../types/restaurant.dto';
import type { PlacePhoto, Restaurant } from '../types/restaurant.model';
import { formatDistance } from './restaurant.mapper';

const QUALIFIED_DIET_LABEL = 'Có thể phù hợp với người ăn chay';

const OPEN_LABELS: Record<PlaceOpeningStatus, string> = {
  [PlaceOpeningStatus.OPEN]: 'Đang mở cửa',
  [PlaceOpeningStatus.CLOSED]: 'Đã đóng cửa',
  [PlaceOpeningStatus.UNKNOWN]: 'Chưa rõ giờ mở cửa',
};

function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Suy đoán loại chay từ tên + địa chỉ + loại hình Google (heuristic, FR-007).
 * KHÔNG bao giờ khẳng định VEGAN chắc chắn — khớp vegan chỉ ra VEGAN_FRIENDLY.
 */
function guessDietType(haystack: string): PlaceDietType {
  if (/\bvegan\b/.test(haystack) || haystack.includes('thuan chay'))
    return PlaceDietType.VEGAN_FRIENDLY;
  if (/\bchay\b/.test(haystack)) return PlaceDietType.VEGETARIAN;
  return PlaceDietType.UNKNOWN;
}

/**
 * GooglePlaceMapper: Google Places (New) thô → khái niệm Quán chung (FR-006).
 * Mọi suy đoán hiển thị nhãn hạn định "Có thể..." (FR-007, SC-005).
 */
export class GooglePlaceMapper extends BaseMapper<GooglePlaceDto, Restaurant> {
  toModel(dto: GooglePlaceDto | null | undefined): Restaurant {
    const toNum = (val: unknown): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const parsed = Number(val);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const ratingRaw = toNum(pickField(dto, ['rating'], null));
    const rating = ratingRaw !== null && ratingRaw >= 0 && ratingRaw <= 5 ? ratingRaw : null;
    const reviewRaw = toNum(pickField(dto, ['userRatingCount'], null));
    const reviewCount =
      reviewRaw !== null && Number.isInteger(reviewRaw) && reviewRaw >= 0 ? reviewRaw : null;

    const openNow = pickField(dto, ['openNow'], null) as boolean | null;
    const openingStatus =
      openNow === true
        ? PlaceOpeningStatus.OPEN
        : openNow === false
          ? PlaceOpeningStatus.CLOSED
          : PlaceOpeningStatus.UNKNOWN;

    const hoursRaw = pickField(dto, ['openingHours'], null) as (string | null)[] | string | null;
    const openingHours = Array.isArray(hoursRaw)
      ? hoursRaw
          .filter((h): h is string => typeof h === 'string' && h.trim().length > 0)
          .join(', ') || null
      : safeString(hoursRaw) || null;

    const photos = safeArray<GooglePlacePhotoDto | null, PlacePhoto>(
      pickField(dto, ['photos'], null),
      (photo) => ({
        url: safeString(photo?.url),
        attribution: safeString(photo?.attribution) || null,
      })
    ).filter((photo) => photo.url.length > 0);

    const name = safeString(pickField(dto, ['displayName'], '')) || 'Quán chay';
    const address = safeString(pickField(dto, ['formattedAddress'], ''));
    const types = safeArray<string | null, string>(pickField(dto, ['types'], null), (t) =>
      safeString(t)
    );
    const dietType = guessDietType(normalizeText(`${name} ${address} ${types.join(' ')}`));

    const id = safeString(pickField(dto, ['id'], ''));

    return {
      id,
      providerId: id,
      name,
      address,
      lat: toNum(pickField(dto, ['latitude'], null)),
      lng: toNum(pickField(dto, ['longitude'], null)),
      distanceM: null,
      distanceLabel: formatDistance(null),
      dishes: [],
      openingHours,
      openingStatus,
      openingStatusLabel: OPEN_LABELS[openingStatus],
      rating,
      reviewCount,
      dietType,
      dietLabel: QUALIFIED_DIET_LABEL,
      photos,
      googleMapsUri: safeString(pickField(dto, ['googleMapsUri'], '')) || null,
      source: 'GOOGLE',
      sourceLabel: 'Google',
      fetchedAt: new Date(),
      isStale: false,
      status: RestaurantStatus.PUBLISHED,
      statusLabel: 'Đang hiển thị',
      submittedByName: null,
    };
  }
}

export const googlePlaceMapper = new GooglePlaceMapper();
