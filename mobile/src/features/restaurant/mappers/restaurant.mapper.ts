import { BaseMapper, pickField, safeArray, safeBoolean, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type {
  LocationGeocodeResponseDto,
  RestaurantDiscoveryResponseDto,
  RestaurantPlaceDto,
  RestaurantPlaceResponseDto,
  RestaurantRecordDto,
  RestaurantRecordListResponseDto,
  RestaurantRecordResponseDto,
  SubmitRestaurantRequestDto,
} from '../types/restaurant.dto';
import type {
  GeocodeLocation,
  LocationQuery,
  Restaurant,
  RestaurantDiscoveryResult,
  RestaurantOpeningHour,
  SubmitRestaurantInput,
  SubmittedRestaurant,
  SubmittedRestaurantListResult,
  SubmittedRestaurantStatus,
} from '../types/restaurant.model';
import { MAX_RADIUS_M, MIN_KEYWORD_LENGTH, MIN_RADIUS_M } from '../schemas/restaurant.schema';

const SOURCE_LABELS: Record<string, string> = {
  INTERNAL: 'VeggieConnect',
  GOOGLE: 'Google',
  SERPAPI: 'Nguồn bản đồ bên ngoài',
  FAKE: 'Dữ liệu demo',
};

const DIET_TAG_LABELS: Record<string, string> = {
  VEGAN: 'Thuần chay',
  LACTO_OVO: 'Chay có trứng sữa',
  BUDDHIST: 'Chay Phật giáo',
  CHRISTIAN: 'Chay Kitô giáo',
};

const MATCH_REASON_LABELS: Record<string, string> = {
  ADMIN_REVIEWED: 'Quản trị viên đã xác minh',
  PROVIDER_TEXT_MATCH: 'Khớp từ khóa tìm kiếm',
  DIETARY_UNREVIEWED: 'Chế độ ăn chưa được xác minh',
  DIET_VEGAN: 'Thuần chay',
  DIET_LACTO_OVO: 'Chay có trứng sữa',
  DIET_BUDDHIST: 'Chay Phật giáo',
  DIET_CHRISTIAN: 'Chay Kitô giáo',
};

const DAY_LABELS: Record<string, string> = {
  monday: 'Thứ hai',
  tuesday: 'Thứ ba',
  wednesday: 'Thứ tư',
  thursday: 'Thứ năm',
  friday: 'Thứ sáu',
  saturday: 'Thứ bảy',
  sunday: 'Chủ nhật',
};

const DAY_ORDER = Object.keys(DAY_LABELS);
const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

/** Backend giới hạn tối đa 20 quán mỗi trang. */
export const PAGE_SIZE = 20;

const STATUS_LABELS: Record<SubmittedRestaurantStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
};

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = safeNumber(value, Number.NaN);
  return Number.isNaN(parsed) ? null : parsed;
}

function stringList(value: unknown): string[] {
  return safeArray<string | null, string>(value as (string | null)[] | null | undefined, (item) => safeString(item)).filter(
    (item) => item.length > 0
  );
}

/** Mét → `850 m` / `2,3 km` (dấu phẩy Việt). */
export function formatDistance(distanceM: number | null): string {
  if (distanceM === null || Number.isNaN(distanceM) || distanceM < 0) return '';
  if (distanceM < 1000) return `${Math.round(distanceM)} m`;
  return `${(distanceM / 1000).toFixed(1).replace('.', ',')} km`;
}

function toOpeningHours(raw: Record<string, string> | null | undefined): RestaurantOpeningHour[] {
  if (!raw || typeof raw !== 'object') return [];
  return Object.entries(raw)
    .map(([day, hours]) => ({ key: day.toLowerCase(), hours: safeString(hours) }))
    .filter((entry) => entry.hours.length > 0)
    .sort((a, b) => {
      const ai = DAY_ORDER.indexOf(a.key);
      const bi = DAY_ORDER.indexOf(b.key);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map((entry) => ({ dayLabel: DAY_LABELS[entry.key] ?? entry.key, hours: entry.hours }));
}

/** Chuyển DTO backend sang model khám phá/đề xuất quán (đọc + body gửi quán). */
export class RestaurantMapper extends BaseMapper<RestaurantPlaceDto, Restaurant> {
  toModel(dto: RestaurantPlaceDto | null | undefined): Restaurant {
    const source = safeString(pickField(dto, ['source'], 'INTERNAL')).toUpperCase();
    const fetchedAt = safeDate(pickField(dto, ['fetchedAt'], null));
    const distanceM = nullableNumber(pickField(dto, ['distanceMeters'], null));
    const dietTags = stringList(pickField(dto, ['dietTags'], null));
    const operatingHours = pickField<Record<string, string> | null>(dto, ['operatingHours'], null);

    return {
      id: safeString(pickField(dto, ['id'], '')),
      name: safeString(pickField(dto, ['name'], '')) || 'Quán chay',
      address: safeString(pickField(dto, ['address'], '')),
      lat: nullableNumber(pickField(dto, ['latitude'], null)),
      lng: nullableNumber(pickField(dto, ['longitude'], null)),
      categories: stringList(pickField(dto, ['categories'], null)),
      rating: nullableNumber(pickField(dto, ['rating'], null)),
      reviewCount: nullableNumber(pickField(dto, ['reviewCount'], null)),
      price: safeString(pickField(dto, ['price'], '')) || null,
      openState: safeString(pickField(dto, ['openState'], '')) || null,
      openingHours: toOpeningHours(operatingHours),
      phone: safeString(pickField(dto, ['phone'], '')) || null,
      website: safeString(pickField(dto, ['website'], '')) || null,
      thumbnailUrl: safeString(pickField(dto, ['thumbnailUrl'], '')) || null,
      mapsUrl: safeString(pickField(dto, ['mapsUrl'], '')) || null,
      dietTags,
      dietTagLabels: dietTags.map((tag) => DIET_TAG_LABELS[tag] ?? tag),
      dietaryReviewed: safeBoolean(pickField(dto, ['dietaryReviewed'], false)),
      source,
      sourceLabel: SOURCE_LABELS[source] ?? 'Nguồn khác',
      attribution: safeString(pickField(dto, ['attribution'], '')),
      fetchedAt,
      isStale: fetchedAt !== null && Date.now() - fetchedAt.getTime() > STALE_AFTER_MS,
      distanceM,
      distanceLabel: formatDistance(distanceM),
      matchReasonLabels: stringList(pickField(dto, ['matchReasons'], null)).map(
        (reason) => MATCH_REASON_LABELS[reason] ?? reason
      ),
    };
  }

  /** `GET /restaurants/nearby|search`. */
  toDiscoveryResult(dto: RestaurantDiscoveryResponseDto | null | undefined): RestaurantDiscoveryResult {
    const items = this.toModelList(pickField(dto, ['data'], null)).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null);
    return {
      items,
      meta: {
        page: safeNumber(pickField(meta, ['page'], 1), 1),
        limit: safeNumber(pickField(meta, ['limit'], 20), 20),
        total: safeNumber(pickField(meta, ['total'], items.length), items.length),
        resultsTruncated: safeBoolean(pickField(meta, ['resultsTruncated'], false)),
        externalDataUnavailable: safeBoolean(pickField(meta, ['externalDataUnavailable'], false)),
      },
    };
  }

  /** `GET /restaurants/:id`. */
  toDetailModel(dto: RestaurantPlaceResponseDto | null | undefined): Restaurant {
    return this.toModel(pickField(dto, ['data'], null));
  }

  /** `GET /location/geocode`. */
  toGeocodeLocation(dto: LocationGeocodeResponseDto | null | undefined): GeocodeLocation | null {
    const data = pickField(dto, ['data'], null);
    const lat = nullableNumber(pickField(data, ['latitude'], null));
    const lng = nullableNumber(pickField(data, ['longitude'], null));
    if (lat === null || lng === null) return null;
    return {
      lat,
      lng,
      label: safeString(pickField(data, ['address'], '')),
      attribution: safeString(pickField(data, ['attribution'], '')),
      externalDataUnavailable: safeBoolean(pickField(dto, ['externalDataUnavailable'], false)),
    };
  }

  toSubmittedModel(dto: RestaurantRecordDto | null | undefined): SubmittedRestaurant {
    const rawStatus = safeString(pickField(dto, ['status'], 'PENDING')).toUpperCase();
    const status: SubmittedRestaurantStatus =
      rawStatus === 'APPROVED' || rawStatus === 'REJECTED' ? rawStatus : 'PENDING';
    const dietTags = stringList(pickField(dto, ['dietTags'], null));
    return {
      id: safeString(pickField(dto, ['id'], '')),
      name: safeString(pickField(dto, ['name'], '')) || 'Quán chay',
      address: safeString(pickField(dto, ['address'], '')),
      categories: stringList(pickField(dto, ['categories'], null)),
      dietTagLabels: dietTags.map((tag) => DIET_TAG_LABELS[tag] ?? tag),
      status,
      statusLabel: STATUS_LABELS[status],
      reviewReason: safeString(pickField(dto, ['reviewReason'], '')) || null,
      createdAt: safeDate(pickField(dto, ['createdAt'], null)),
      reviewedAt: safeDate(pickField(dto, ['reviewedAt'], null)),
    };
  }

  /** `POST /restaurants` → bản ghi vừa gửi. */
  toSubmittedFromResponse(dto: RestaurantRecordResponseDto | null | undefined): SubmittedRestaurant {
    return this.toSubmittedModel(pickField(dto, ['data'], null));
  }

  /** `GET /restaurants/mine`. */
  toSubmittedList(dto: RestaurantRecordListResponseDto | null | undefined): SubmittedRestaurantListResult {
    const rawItems = safeArray<RestaurantRecordDto | null, RestaurantRecordDto | null>(
      pickField(dto, ['data'], null),
      (item) => item
    );
    const items = rawItems.map((item) => this.toSubmittedModel(item)).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null);
    return { items, total: safeNumber(pickField(meta, ['total'], items.length), items.length) };
  }

  toSubmitDto(input: SubmitRestaurantInput): SubmitRestaurantRequestDto {
    return {
      name: input.name.trim(),
      address: input.address.trim(),
      latitude: input.lat,
      longitude: input.lng,
      categories: input.categories,
      dietTags: input.dietTags,
    };
  }

  /** Query string cho `nearby`/`search`; vị trí thiết bị phải gửi kèm đồng ý của người dùng. */
  toLocationParams(query: LocationQuery, page = 1): Record<string, string | number> {
    const params: Record<string, string | number> = {
      lat: query.lat,
      lng: query.lng,
      radiusMeters: Math.max(MIN_RADIUS_M, Math.min(MAX_RADIUS_M, Math.round(query.radiusM))),
      locationSource: query.source,
      page,
      limit: PAGE_SIZE,
    };
    if (query.source === 'DEVICE') params.locationConsent = 'true';
    if (query.dietPattern) params.dietPattern = query.dietPattern;
    if (hasSearchKeyword(query.query)) params.q = query.query.trim();
    return params;
  }
}

export function hasSearchKeyword(keyword: string): boolean {
  return keyword.trim().length >= MIN_KEYWORD_LENGTH;
}

export const restaurantMapper = new RestaurantMapper();
