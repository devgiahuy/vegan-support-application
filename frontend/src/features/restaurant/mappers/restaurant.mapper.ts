import {
  BaseMapper,
  pickField,
  safeArray,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  AdminRestaurantListResponseDto,
  GeocodeResponseDto,
  RestaurantDto,
  RestaurantListResponseDto,
  RestaurantResponseDto,
  ReviewRestaurantRequestDto,
  ReviewRestaurantResponseDto,
  SubmitRestaurantRequestDto,
} from '../types/restaurant.dto';
import type { LocationQuery, Restaurant, SubmitRestaurantInput } from '../types/restaurant.model';
import { RestaurantStatus, PlaceDietType, PlaceOpeningStatus } from '@/common/enums';

const SOURCE_LABELS: Record<string, string> = {
  INTERNAL: 'Nội bộ',
  GOOGLE: 'Google',
};

const DIET_LABELS: Record<PlaceDietType, string> = {
  [PlaceDietType.VEGAN]: 'Thuần chay',
  [PlaceDietType.VEGETARIAN]: 'Quán chay',
  [PlaceDietType.VEGAN_FRIENDLY]: 'Thân thiện với người ăn chay',
  [PlaceDietType.UNKNOWN]: 'Có thể phù hợp với người ăn chay',
};

const OPENING_LABELS: Record<PlaceOpeningStatus, string> = {
  [PlaceOpeningStatus.OPEN]: 'Đang mở cửa',
  [PlaceOpeningStatus.CLOSED]: 'Đã đóng cửa',
  [PlaceOpeningStatus.UNKNOWN]: 'Chưa rõ giờ mở cửa',
};

const STATUS_LABELS: Record<RestaurantStatus, string> = {
  [RestaurantStatus.PENDING]: 'Chờ duyệt',
  [RestaurantStatus.PUBLISHED]: 'Đang hiển thị',
};

const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

function emptyPageMeta() {
  return { page: 1, limit: 10, totalItems: 0, totalPages: 0 };
}

function toPageMeta(
  meta:
    | { page?: number; limit?: number; total?: number; totalPages?: number; total_pages?: number }
    | null
    | undefined,
  fallbackTotal: number
) {
  const page = safeNumber(pickField(meta, ['page'], 1));
  const limit = safeNumber(pickField(meta, ['limit'], 10));
  const totalItems = safeNumber(pickField(meta, ['total'], fallbackTotal));
  const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/** Mét → `850 m` / `2,3 km` (dấu phẩy Việt). */
export function formatDistance(distanceM: number | null): string {
  if (distanceM === null || Number.isNaN(distanceM) || distanceM < 0) return '';
  if (distanceM < 1000) return `${Math.round(distanceM)} m`;
  return `${(distanceM / 1000).toFixed(1).replace('.', ',')} km`;
}

/**
 * RestaurantMapper: quán, geocode, review. Sắp xếp khoảng cách ở tầng api.
 * DTO SUY LUẬN — mọi field optional + fallback. Envelope đọc trực tiếp.
 */
export class RestaurantMapper extends BaseMapper<RestaurantDto, Restaurant> {
  toModel(dto: RestaurantDto | null | undefined): Restaurant {
    const toNum = (val: unknown): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const parsed = safeNumber(val, NaN);
      return Number.isNaN(parsed) ? null : parsed;
    };
    const status = safeEnum(
      pickField(dto, ['status'], 'PUBLISHED'),
      RestaurantStatus,
      RestaurantStatus.PUBLISHED
    );
    const source = safeString(pickField(dto, ['source'], 'INTERNAL')).toUpperCase();
    const fetchedAt = safeDate(pickField(dto, ['fetchedAt', 'fetched_at'], null));
    const distanceM = toNum(pickField(dto, ['distanceM', 'distance_m'], null));
    const submitter = pickField(dto, ['submittedBy'], null) as RestaurantDto['submittedBy'];
    // Quán nội bộ/cộng đồng đã qua duyệt (PUBLISHED) được coi là xác thực chay;
    // hàng chờ (PENDING) vẫn gắn nhãn hạn định như suy đoán (FR-007).
    const dietType =
      status === RestaurantStatus.PUBLISHED && source !== 'GOOGLE'
        ? PlaceDietType.VEGETARIAN
        : PlaceDietType.UNKNOWN;
    return {
      id: safeString(pickField(dto, ['id'], '')),
      providerId: safeString(pickField(dto, ['id'], '')),
      name: safeString(pickField(dto, ['name'], '')) || 'Quán chay',
      address: safeString(pickField(dto, ['address'], '')),
      lat: toNum(pickField(dto, ['lat', 'latitude'], null)),
      lng: toNum(pickField(dto, ['lng', 'longitude'], null)),
      distanceM,
      distanceLabel: formatDistance(distanceM),
      dishes: safeArray<string | null, string>(pickField(dto, ['dishes'], null), (dish) =>
        safeString(dish)
      ).filter((dish) => dish.length > 0),
      openingHours: safeString(pickField(dto, ['openingHours', 'opening_hours'], '')) || null,
      openingStatus: PlaceOpeningStatus.UNKNOWN,
      openingStatusLabel: OPENING_LABELS[PlaceOpeningStatus.UNKNOWN],
      rating: null,
      reviewCount: null,
      dietType,
      dietLabel: DIET_LABELS[dietType],
      photos: [],
      googleMapsUri: null,
      source,
      sourceLabel: SOURCE_LABELS[source] ?? source,
      fetchedAt,
      isStale: fetchedAt !== null && Date.now() - fetchedAt.getTime() > STALE_AFTER_MS,
      status,
      statusLabel: STATUS_LABELS[status],
      submittedByName:
        submitter && typeof submitter === 'object'
          ? safeString((submitter as { displayName?: string }).displayName) || null
          : null,
    };
  }

  /** Nearby/search/detail list — sắp xếp do tầng api đảm nhiệm. */
  toListModel(dto: RestaurantListResponseDto | null | undefined): PaginationResult<Restaurant> {
    const rawItems = pickField(dto, ['data'], null) as (RestaurantDto | null)[] | null;
    const items = this.toModelList(
      safeArray<RestaurantDto | null, RestaurantDto | null>(rawItems, (item) => item)
    ).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as RestaurantListResponseDto['meta'];
    return {
      items,
      metadata: meta
        ? toPageMeta(meta, items.length)
        : { ...emptyPageMeta(), totalItems: items.length },
    };
  }

  /** `GET /restaurants/:id` → 1 quán. */
  toSingleModel(dto: RestaurantResponseDto | null | undefined): Restaurant {
    const data = pickField(dto, ['data'], null) as RestaurantDto | null;
    return this.toModel(data);
  }

  /** `GET /admin/restaurants` → hàng chờ. */
  toQueueModel(
    dto: AdminRestaurantListResponseDto | null | undefined
  ): PaginationResult<Restaurant> {
    const rawItems = pickField(dto, ['data'], null) as (RestaurantDto | null)[] | null;
    const items = this.toModelList(
      safeArray<RestaurantDto | null, RestaurantDto | null>(rawItems, (item) => item)
    ).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as AdminRestaurantListResponseDto['meta'];
    return {
      items,
      metadata: meta
        ? toPageMeta(meta, items.length)
        : { ...emptyPageMeta(), totalItems: items.length },
    };
  }

  /** `PATCH /admin/restaurants/:id/review` → quán sau duyệt. */
  toReviewedModel(dto: ReviewRestaurantResponseDto | null | undefined): Restaurant {
    const data = pickField(dto, ['data'], null) as RestaurantDto | null;
    return this.toModel(data);
  }

  /** `GET /location/geocode` → tọa độ + nhãn. */
  toCoordinates(dto: GeocodeResponseDto | null | undefined): {
    lat: number | null;
    lng: number | null;
    label: string;
  } {
    const data = pickField(dto, ['data'], null) as GeocodeResponseDto['data'];
    const toNum = (val: unknown): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const parsed = safeNumber(val, NaN);
      return Number.isNaN(parsed) ? null : parsed;
    };
    return {
      lat: toNum(pickField(data, ['lat'], null)),
      lng: toNum(pickField(data, ['lng'], null)),
      label: safeString(pickField(data, ['label'], '')),
    };
  }

  toSubmitDto(input: SubmitRestaurantInput): SubmitRestaurantRequestDto {
    return {
      name: input.name,
      address: input.address,
      ...(input.lat !== undefined ? { lat: input.lat } : {}),
      ...(input.lng !== undefined ? { lng: input.lng } : {}),
      ...(input.dishes.length > 0 ? { dishes: input.dishes } : {}),
      ...(input.note ? { note: input.note } : {}),
    };
  }

  toReviewDto(decision: 'APPROVE' | 'REJECT', reason: string): ReviewRestaurantRequestDto {
    return { decision, reason };
  }

  toLocationQuery(query: LocationQuery): Record<string, string | number> {
    if (query.addressText && query.addressText.trim().length > 0) {
      return {
        address: query.addressText.trim(),
        radius: query.radiusM,
        ...(query.query ? { q: query.query } : {}),
      };
    }
    return {
      lat: query.lat ?? 0,
      lng: query.lng ?? 0,
      radius: query.radiusM,
      ...(query.query ? { q: query.query } : {}),
    };
  }
}

export const restaurantMapper = new RestaurantMapper();
