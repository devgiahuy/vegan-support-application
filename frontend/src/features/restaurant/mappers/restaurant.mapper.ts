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
import { RestaurantStatus, RestaurantSource } from '@/common/enums';

const SOURCE_LABELS: Record<string, string> = {
  INTERNAL: 'Cộng đồng VeggieConnect',
  GOOGLE_PLACES: 'Google Places',
  GOOGLE: 'Google Places',
};

const STATUS_LABELS: Record<RestaurantStatus, string> = {
  [RestaurantStatus.PENDING]: 'Chờ duyệt',
  [RestaurantStatus.PUBLISHED]: 'Đang hiển thị',
  [RestaurantStatus.REJECTED]: 'Bị từ chối',
  [RestaurantStatus.ARCHIVED]: 'Đã lưu trữ',
};

const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

function emptyPageMeta() {
  return {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  };
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
 * DTO theo đặc tả Phase 24 — mọi field an toàn + fallback.
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
    const rawSource = safeString(pickField(dto, ['source'], 'INTERNAL')).toUpperCase();
    const source =
      rawSource === 'GOOGLE' || rawSource === 'GOOGLE_PLACES'
        ? RestaurantSource.GOOGLE_PLACES
        : RestaurantSource.INTERNAL;
    const fetchedAt = safeDate(pickField(dto, ['fetchedAt', 'fetched_at'], null));
    const distanceM = toNum(pickField(dto, ['distanceMeters', 'distanceM', 'distance_m'], null));
    const submitter = pickField(dto, ['submittedBy'], null) as RestaurantDto['submittedBy'];

    const rawHours = pickField(dto, ['openingHours', 'opening_hours', 'operatingHours'], null);
    let openingHours: string | null = null;
    if (typeof rawHours === 'string') {
      const trimmed = (rawHours as string).trim();
      openingHours = trimmed.length > 0 ? trimmed : null;
    } else if (rawHours && typeof rawHours === 'object') {
      openingHours = Object.entries(rawHours as Record<string, string>)
        .map(([day, hours]) => `${day}: ${hours}`)
        .join(', ');
    }

    return {
      id: safeString(pickField(dto, ['id'], '')),
      name: safeString(pickField(dto, ['name'], '')) || 'Quán chay',
      address: safeString(pickField(dto, ['address'], '')),
      lat: toNum(pickField(dto, ['lat', 'latitude'], null)),
      lng: toNum(pickField(dto, ['lng', 'longitude'], null)),
      distanceM,
      distanceLabel: formatDistance(distanceM),
      dietaryTags: safeArray<string | null, string>(
        pickField(dto, ['dietaryTags', 'dietTags'], null),
        (tag) => safeString(tag)
      ).filter((tag) => tag.length > 0),
      dishes: safeArray<string | null, string>(pickField(dto, ['dishes'], null), (dish) =>
        safeString(dish)
      ).filter((dish) => dish.length > 0),
      openingHours,
      priceRange: safeString(pickField(dto, ['priceRange', 'price_range'], '')) || null,
      phoneNumber: safeString(pickField(dto, ['phoneNumber', 'phone_number', 'phone'], '')) || null,
      websiteUrl: safeString(pickField(dto, ['websiteUrl', 'website_url', 'website'], '')) || null,
      source,
      sourceLabel: SOURCE_LABELS[source] ?? 'Quán chay',
      fetchedAt,
      isStale: fetchedAt !== null && Date.now() - fetchedAt.getTime() > STALE_AFTER_MS,
      status,
      statusLabel: STATUS_LABELS[status] ?? 'Đang hiển thị',
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
      lat: toNum(pickField(data, ['lat', 'latitude'], null)),
      lng: toNum(pickField(data, ['lng', 'longitude'], null)),
      label: safeString(pickField(data, ['label', 'address'], '')),
    };
  }

  toSubmitDto(input: SubmitRestaurantInput): SubmitRestaurantRequestDto {
    return {
      name: input.name,
      address: input.address,
      ...(input.lat !== undefined ? { lat: input.lat } : {}),
      ...(input.lng !== undefined ? { lng: input.lng } : {}),
      ...(input.dietaryTags && input.dietaryTags.length > 0
        ? { dietaryTags: input.dietaryTags }
        : {}),
      ...(input.dishes.length > 0 ? { dishes: input.dishes } : {}),
      ...(input.openingHours ? { openingHours: input.openingHours } : {}),
      ...(input.priceRange ? { priceRange: input.priceRange } : {}),
      ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
      ...(input.note ? { note: input.note } : {}),
    };
  }

  toReviewDto(decision: 'APPROVE' | 'REJECT', reason?: string): ReviewRestaurantRequestDto {
    return { decision, ...(reason ? { reason } : {}) };
  }

  toLocationQuery(query: LocationQuery): Record<string, string | number> {
    const base: Record<string, string | number> = {
      radiusMeters: Math.max(100, Math.min(50000, Math.round(query.radiusM || 5000))),
    };
    if (
      query.lat !== undefined &&
      query.lng !== undefined &&
      !Number.isNaN(query.lat) &&
      !Number.isNaN(query.lng)
    ) {
      base.lat = query.lat;
      base.lng = query.lng;
    }
    if (query.query && query.query.trim().length >= 2) {
      base.q = query.query.trim();
    }
    if (query.dietaryTags && query.dietaryTags.length > 0) {
      const upper = query.dietaryTags.map((t) => t.toUpperCase());
      if (upper.includes('VEGAN')) {
        base.dietPattern = 'VEGAN';
      } else if (upper.some((t) => t.includes('LACTO') || t.includes('OVO'))) {
        base.dietPattern = 'LACTO_OVO';
      }
    }
    return base;
  }
}

export const restaurantMapper = new RestaurantMapper();
