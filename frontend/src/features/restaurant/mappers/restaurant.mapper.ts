import {
  BaseMapper,
  pickField,
  safeArray,
  safeBoolean,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import {
  RestaurantDietTag,
  RestaurantOpenState,
  RestaurantSource,
  RestaurantStatus,
  RestaurantWeekday,
} from '@/common/enums';
import { MAX_RADIUS_M, MIN_RADIUS_M } from '../schemas/restaurant.schema';
import type {
  AdminRestaurantListResponseDto,
  GeocodeResponseDto,
  RestaurantDiscoveryMetaDto,
  RestaurantDto,
  RestaurantListResponseDto,
  RestaurantResponseDto,
  ReviewRestaurantRequestDto,
  ReviewRestaurantResponseDto,
  SubmitRestaurantRequestDto,
} from '../types/restaurant.dto';
import type {
  DiscoveryNotice,
  Restaurant,
  RestaurantDiscoveryMeta,
  RestaurantDiscoveryResult,
  RestaurantGeocodeResult,
  RestaurantSearchState,
  SubmitRestaurantInput,
} from '../types/restaurant.model';
import { isBoundsUsable } from '../utils/restaurant-bounds';

/** Quá 30 ngày chưa cập nhật thì coi là dữ liệu cũ. */
const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

const SOURCE_LABELS: Record<RestaurantSource, string> = {
  [RestaurantSource.INTERNAL]: 'Cộng đồng VeggieConnect',
  [RestaurantSource.GOOGLE]: 'Google Maps',
  [RestaurantSource.SERPAPI]: 'SerpApi (dữ liệu Google Maps)',
  [RestaurantSource.FAKE]: 'Dữ liệu minh hoạ',
};

const PROVIDER_LABELS: Record<string, string> = {
  internal: 'Dữ liệu nội bộ',
  google: 'Google Maps',
  serpapi: 'SerpApi',
  fake: 'dữ liệu minh hoạ',
};

const STATUS_LABELS: Record<RestaurantStatus, string> = {
  [RestaurantStatus.PENDING]: 'Chờ duyệt',
  [RestaurantStatus.PUBLISHED]: 'Đang hiển thị',
  [RestaurantStatus.REJECTED]: 'Bị từ chối',
  [RestaurantStatus.ARCHIVED]: 'Đã lưu trữ',
};

const DIET_TAG_LABELS: Record<string, string> = {
  VEGAN: 'Thuần chay (Vegan)',
  LACTO_OVO: 'Chay có sữa và trứng',
  LACTO_VEGETARIAN: 'Chay có sữa',
  OVO_VEGETARIAN: 'Chay có trứng',
  BUDDHIST: 'Chay kiểng Phật',
  CHRISTIAN: 'Chay kiểng Kitô',
};

const OPEN_STATE_LABELS: Record<RestaurantOpenState, string> = {
  [RestaurantOpenState.NOW]: 'Đang mở',
  [RestaurantOpenState.TWENTY_FOUR_HOURS]: 'Mở 24 giờ',
};

const VALID_DIET_TAGS: readonly string[] = [
  RestaurantDietTag.VEGAN,
  RestaurantDietTag.LACTO_OVO,
  RestaurantDietTag.BUDDHIST,
  RestaurantDietTag.CHRISTIAN,
];

/** Ép số an toàn: trả `null` thay vì `NaN`. */
function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = safeNumber(value, NaN);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Ép ngày an toàn. */
function toNullableDate(value: unknown): Date | null {
  return safeDate(value, null);
}

/** Ép giá trị nguyên trong khoảng, trả `undefined` nếu ngoài khoảng. */
function toIntInRange(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isInteger(value)) return undefined;
  if (value < min || value > max) return undefined;
  return value;
}

function toNumberInRange(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  if (value < min || value > max) return undefined;
  return value;
}

/** Mét → `850 m` / `2,3 km` (dấu phẩy kiểu Việt Nam). */
export function formatDistance(distanceM: number | null): string {
  if (distanceM === null || Number.isNaN(distanceM) || distanceM < 0) return '';
  if (distanceM < 1000) return `${Math.round(distanceM)} m`;
  return `${(distanceM / 1000).toFixed(1).replace('.', ',')} km`;
}

/** Điểm đánh giá → `4,5` hoặc rỗng. */
function formatRating(rating: number | null): string {
  if (rating === null) return '';
  return rating.toFixed(1).replace('.', ',');
}

function formatReviewCount(count: number | null): string {
  if (count === null || count <= 0) return '';
  return `${Math.round(count).toLocaleString('vi-VN')} đánh giá`;
}

/** `publisherResultLimit` → câu thông báo cụ thể. */
function truncatedNotice(limit: number | null): DiscoveryNotice {
  const limitText = limit !== null && limit > 0 ? ` tối đa ${limit} kết quả` : '';
  return {
    kind: 'TRUNCATED',
    tone: 'warning',
    message: `Kết quả có thể chưa đầy đủ: nhà cung cấp bản đồ chỉ trả về${limitText} cho mỗi lần tìm.`,
  };
}

function defaultDiscoveryMeta(totalItems: number): RestaurantDiscoveryMeta {
  return {
    page: 1,
    limit: 20,
    totalItems,
    totalPages: Math.ceil(totalItems / 20),
    hasNextPage: totalItems > 20,
    hasPrevPage: false,
    externalDataUnavailable: false,
    externalResultsSuppressed: false,
    resultsTruncated: false,
    provider: '',
    providerLabel: '',
    providerResultLimit: null,
    locationStored: false,
  };
}

/**
 * RestaurantMapper: quán chay, discovery, geocode, đề xuất.
 *
 * Nguyên tắc (docs/ARCHITECTURE.md §3):
 * - Mọi field đọc qua `pickField` + `safe*`; tên field theo contract được thử trước tên alias.
 * - Mọi nhãn tiếng Việt và giá trị định dạng chuẩn bị ở đây, KHÔNG format trong JSX.
 * - Giữ nguyên thứ tự backend trả về: không tự sắp xếp lại.
 */
export class RestaurantMapper extends BaseMapper<RestaurantDto, Restaurant> {
  toModel(dto: RestaurantDto | null | undefined): Restaurant {
    const lat = toNullableNumber(pickField(dto, ['latitude', 'lat'], null));
    const lng = toNullableNumber(pickField(dto, ['longitude', 'lng'], null));
    const distanceM = toNullableNumber(
      pickField(dto, ['distanceMeters', 'distanceM', 'distance_m'], null)
    );
    const rating = toNullableNumber(pickField(dto, ['rating'], null));
    const reviewCount = toNullableNumber(pickField(dto, ['reviewCount'], null));

    const source = safeEnum(
      pickField(dto, ['source'], 'INTERNAL'),
      RestaurantSource,
      RestaurantSource.INTERNAL
    );
    const isExternal = source !== RestaurantSource.INTERNAL;

    const openStateRaw = safeString(pickField(dto, ['openState'], ''));
    const openState =
      openStateRaw.length > 0
        ? safeEnum(openStateRaw, RestaurantOpenState, null as unknown as RestaurantOpenState)
        : null;

    const operatingHoursRaw = pickField<unknown>(
      dto,
      ['operatingHours', 'openingHours', 'opening_hours'],
      null
    );
    const operatingHoursByDay: Record<string, string> = {};
    let openingHours: string | null = null;
    if (typeof operatingHoursRaw === 'string') {
      const trimmed = operatingHoursRaw.trim();
      openingHours = trimmed.length > 0 ? trimmed : null;
    } else if (operatingHoursRaw && typeof operatingHoursRaw === 'object') {
      for (const [day, hours] of Object.entries(operatingHoursRaw as Record<string, unknown>)) {
        const value = safeString(hours);
        if (value.length > 0) operatingHoursByDay[day] = value;
      }
      const entries = Object.entries(operatingHoursByDay);
      openingHours =
        entries.length > 0 ? entries.map(([day, hours]) => `${day}: ${hours}`).join(', ') : null;
    }

    const dietaryTags = safeArray<string | null, string>(
      pickField(dto, ['dietTags', 'dietaryTags'], null),
      (tag) => safeString(tag)
    )
      .filter((tag) => tag.length > 0)
      .filter((tag, index, all) => all.indexOf(tag) === index);

    const dietaryReviewed = safeBoolean(pickField(dto, ['dietaryReviewed'], false), false);
    const fetchedAt = toNullableDate(pickField(dto, ['fetchedAt', 'fetched_at'], null));
    const status = safeEnum(
      dto?.status === 'APPROVED' ? RestaurantStatus.PUBLISHED : pickField(dto, ['status'], RestaurantStatus.PUBLISHED),
      RestaurantStatus,
      RestaurantStatus.PUBLISHED
    );
    const submitter = pickField(dto, ['submittedBy'], null) as RestaurantDto['submittedBy'];

    return {
      id: safeString(pickField(dto, ['id'], '')),
      name: safeString(pickField(dto, ['name'], '')) || 'Quán chay',
      address: safeString(pickField(dto, ['address'], '')),
      lat,
      lng,
      hasCoordinates: lat !== null && lng !== null,

      distanceM,
      distanceLabel: formatDistance(distanceM),

      dietaryTags,
      dietaryTagLabels: dietaryTags.map((tag) => DIET_TAG_LABELS[tag] ?? tag),
      dishes: safeArray<string | null, string>(pickField(dto, ['dishes'], null), (dish) =>
        safeString(dish)
      ).filter((dish) => dish.length > 0),

      openingHours,
      operatingHoursByDay,

      priceLabel: safeString(pickField(dto, ['price', 'priceRange', 'price_range'], '')) || null,
      phoneNumber: safeString(pickField(dto, ['phone', 'phoneNumber', 'phone_number'], '')) || null,
      websiteUrl: safeString(pickField(dto, ['website', 'websiteUrl', 'website_url'], '')) || null,
      thumbnailUrl: safeString(pickField(dto, ['thumbnailUrl'], '')) || null,
      mapsUrl: safeString(pickField(dto, ['mapsUrl'], '')) || null,

      rating,
      ratingLabel: formatRating(rating),
      reviewCountLabel: formatReviewCount(reviewCount),

      openState: openStateRaw.length > 0 && openState !== null ? openState : null,
      openStateLabel: openState !== null ? (OPEN_STATE_LABELS[openState] ?? '') : '',

      source,
      sourceLabel: SOURCE_LABELS[source] ?? SOURCE_LABELS[RestaurantSource.INTERNAL],
      isExternal,
      attribution: safeString(pickField(dto, ['attribution'], '')),
      dietaryReviewed,
      requiresDietaryWarning: isExternal && !dietaryReviewed,
      matchReasons: safeArray<string | null, string>(
        pickField(dto, ['matchReasons'], null),
        (reason) => safeString(reason)
      ).filter((reason) => reason.length > 0),

      fetchedAt,
      isStale: fetchedAt !== null && Date.now() - fetchedAt.getTime() > STALE_AFTER_MS,

      status,
      statusLabel: STATUS_LABELS[status] ?? STATUS_LABELS[RestaurantStatus.PUBLISHED],
      submittedByName:
        submitter && typeof submitter === 'object'
          ? safeString((submitter as { displayName?: string }).displayName) || null
          : null,
    };
  }

  /** `GET /restaurants/nearby|search` → danh sách + meta provider + cảnh báo đã dịch. */
  toDiscoveryModel(dto: RestaurantListResponseDto | null | undefined): RestaurantDiscoveryResult {
    const rawItems = pickField(dto, ['data'], null) as (RestaurantDto | null)[] | null;
    const restaurants = this.toModelList(
      safeArray<RestaurantDto | null, RestaurantDto | null>(rawItems, (item) => item)
    ).filter((item) => item.id.length > 0);

    const metaDto = pickField(dto, ['meta'], null) as RestaurantDiscoveryMetaDto | null;
    const meta = this.toDiscoveryMeta(metaDto, restaurants.length);

    return { restaurants, meta, notices: this.buildNotices(meta, restaurants) };
  }

  private toDiscoveryMeta(
    metaDto: RestaurantDiscoveryMetaDto | null | undefined,
    fallbackTotal: number
  ): RestaurantDiscoveryMeta {
    const base = defaultDiscoveryMeta(fallbackTotal);
    if (!metaDto) return base;

    const totalFromBackend = toNullableNumber(pickField(metaDto, ['total'], null));
    const totalPagesFromBackend = toNullableNumber(
      pickField(metaDto, ['totalPages', 'total_pages'], null)
    );
    const page = toNullableNumber(pickField(metaDto, ['page'], null)) ?? base.page;
    const limit = toNullableNumber(pickField(metaDto, ['limit'], null)) ?? base.limit;
    const provider = safeString(pickField(metaDto, ['provider'], ''));
    const totalPages = totalPagesFromBackend ?? Math.ceil((totalFromBackend ?? fallbackTotal) / Math.max(1, limit));

    return {
      page,
      limit,
      totalItems: totalFromBackend ?? fallbackTotal,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      externalDataUnavailable: safeBoolean(
        pickField(metaDto, ['externalDataUnavailable'], false),
        false
      ),
      externalResultsSuppressed: safeBoolean(pickField(metaDto, ['externalResultsSuppressed'], false), false),
      resultsTruncated: safeBoolean(pickField(metaDto, ['resultsTruncated'], false), false),
      provider,
      providerLabel: PROVIDER_LABELS[provider.toLowerCase()] ?? provider,
      providerResultLimit: toNullableNumber(pickField(metaDto, ['providerResultLimit'], null)),
      locationStored: safeBoolean(pickField(metaDto, ['locationStored'], false), false),
    };
  }

  private buildNotices(
    meta: RestaurantDiscoveryMeta,
    restaurants: Restaurant[]
  ): DiscoveryNotice[] {
    const notices: DiscoveryNotice[] = [];

    if (meta.externalDataUnavailable) {
      notices.push({
        kind: 'UNAVAILABLE',
        tone: 'warning',
        message:
          'Một phần dữ liệu bản đồ chưa tải được. Kết quả có thể chưa đầy đủ; bạn có thể thử lại.',
      });
    }

    if (meta.externalResultsSuppressed) {
      notices.push({
        kind: 'SUPPRESSED',
        tone: 'info',
        message: 'Các quán chưa được xác minh đã được loại khỏi kết quả để áp dụng chế độ ăn, dị ứng hoặc thành phần bạn cần tránh.',
      });
    }

    if (meta.resultsTruncated) {
      notices.push(truncatedNotice(meta.providerResultLimit));
    }

    if (restaurants.some((restaurant) => restaurant.isExternal)) {
      const providerName = meta.providerLabel || meta.provider;
      notices.push({
        kind: 'ATTRIBUTION',
        tone: 'info',
        message: providerName
          ? `Dữ liệu bản đồ được cung cấp bởi ${providerName} và có thể chưa được kiểm duyệt.`
          : 'Dữ liệu bản đồ được cung cấp bởi nhà cung cấp bên ngoài và có thể chưa được kiểm duyệt.',
      });
    }

    const staleCount = restaurants.filter((restaurant) => restaurant.isStale).length;
    if (staleCount > 0) {
      notices.push({
        kind: 'STALE',
        tone: 'info',
        message: `${staleCount} quán trong danh sách chưa được cập nhật hơn 30 ngày. Giờ mở cửa hoặc thực đơn có thể đã thay đổi, vui lòng liên hệ quán trước khi đến.`,
      });
    }

    // Hệ thống cam kết không lưu giữ vị trí của người dùng (SC-007). Chỉ hiện khi backend xác nhận.
    if (meta.locationStored === false) {
      notices.push({
        kind: 'PRIVACY',
        tone: 'info',
        message: 'Vị trí bạn dùng để tìm kiếm chỉ dùng cho lần tìm này và không được lưu giữ.',
      });
    }

    return notices;
  }

  /** Danh sách dạng phân trang — dùng bởi các màn hình khác, không dùng cho discovery. */
  toListModel(dto: RestaurantListResponseDto | null | undefined): PaginationResult<Restaurant> {
    const rawItems = pickField(dto, ['data'], null) as (RestaurantDto | null)[] | null;
    const items = this.toModelList(
      safeArray<RestaurantDto | null, RestaurantDto | null>(rawItems, (item) => item)
    ).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as RestaurantDiscoveryMetaDto | null;
    return { items, metadata: this.toPageMeta(meta, items.length) };
  }

  private toPageMeta(
    meta: RestaurantDiscoveryMetaDto | null | undefined,
    fallbackTotal: number
  ): PaginationResult<Restaurant>['metadata'] {
    if (!meta) {
      return {
        page: 1,
        limit: 20,
        totalItems: fallbackTotal,
        totalPages: Math.ceil(fallbackTotal / 20),
        hasNextPage: fallbackTotal > 20,
        hasPrevPage: false,
      };
    }
    const page = toNullableNumber(pickField(meta, ['page'], null)) ?? 1;
    const limit = toNullableNumber(pickField(meta, ['limit'], null)) ?? 20;
    const totalItems = toNullableNumber(pickField(meta, ['total'], null)) ?? fallbackTotal;
    const totalPages = toNullableNumber(pickField(meta, ['totalPages', 'total_pages'], null)) ?? Math.ceil(totalItems / Math.max(1, limit));
    return {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: totalPages > 0 && page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /** `GET /restaurants/:id` → 1 quán. */
  toSingleModel(dto: RestaurantResponseDto | null | undefined): Restaurant {
    return this.toModel(pickField(dto, ['data'], null) as RestaurantDto | null);
  }

  /** `GET /admin/restaurants` → hàng chờ (ngoài phạm vi redesign, giữ cho màn hình quản trị). */
  toQueueModel(
    dto: AdminRestaurantListResponseDto | null | undefined
  ): PaginationResult<Restaurant> {
    return this.toListModel(dto as RestaurantListResponseDto | null | undefined);
  }

  /** `PATCH /admin/restaurants/:id/review` → quán sau duyệt. */
  toReviewedModel(dto: ReviewRestaurantResponseDto | null | undefined): Restaurant {
    return this.toModel(pickField(dto, ['data'], null) as RestaurantDto | null);
  }

  /**
   * `GET /location/geocode` → tọa độ + nhãn.
   * `data: null` nghĩa là không phân giải được: trả `isAvailable: false`,
   * TUYỆT ĐỐI không thay bằng một tọa độ mặc định không liên quan (FR-033).
   */
  toGeocodeResult(dto: GeocodeResponseDto | null | undefined): RestaurantGeocodeResult {
    const unavailable: RestaurantGeocodeResult = {
      lat: null,
      lng: null,
      label: '',
      placeId: null,
      attribution: '',
      isAvailable: false,
    };

    const data = pickField<Record<string, unknown> | null>(dto, ['data'], null);
    if (!data || typeof data !== 'object') return unavailable;

    const lat = toNullableNumber(pickField(data, ['latitude', 'lat'], null));
    const lng = toNullableNumber(pickField(data, ['longitude', 'lng'], null));
    if (lat === null || lng === null) {
      return {
        ...unavailable,
        label: safeString(pickField(data, ['address', 'label'], '')),
        attribution: safeString(pickField(data, ['attribution'], '')),
      };
    }

    return {
      lat,
      lng,
      label: safeString(pickField(data, ['address', 'label'], '')),
      placeId: safeString(pickField(data, ['placeId'], '')) || null,
      attribution: safeString(pickField(data, ['attribution'], '')),
      isAvailable: true,
    };
  }

  /** `POST /restaurants` → payload đúng `submitRestaurantSchema` (`.strict()`). */
  toSubmitDto(input: SubmitRestaurantInput): SubmitRestaurantRequestDto {
    const dietTags = safeArray<string, string>(input.dietTags ?? null, (tag) =>
      safeString(tag)
    ).filter((tag) => VALID_DIET_TAGS.includes(tag));

    return {
      name: input.name,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      ...(input.categories && input.categories.length > 0 ? { categories: input.categories } : {}),
      ...(dietTags.length > 0 ? { dietTags } : {}),
      ...(input.allergenFreeCodes && input.allergenFreeCodes.length > 0
        ? { allergenFreeCodes: input.allergenFreeCodes }
        : {}),
      ...(input.excludedIngredients && input.excludedIngredients.length > 0
        ? { excludedIngredients: input.excludedIngredients }
        : {}),
    };
  }

  /** `PATCH /admin/restaurants/:id/review` — giữ nguyên shape cho luồng quản trị. */
  toReviewDto(decision: 'APPROVE' | 'REJECT', reason?: string): ReviewRestaurantRequestDto {
    if (!reason || reason.trim().length < 3) {
      throw new Error('Vui lòng nhập lý do quyết định (tối thiểu 3 ký tự).');
    }
    return { decision: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', reason: reason.trim() };
  }

  /**
   * Dựng query params cho `nearby`/`search` từ state tìm kiếm.
   * Ràng buộc theo `restaurant.schemas.ts`:
   * - `radiusMeters` luôn clamp về [100, 50000].
   * - `lat`/`lng` đi cùng nhau; bounds phải đủ bốn mốc và đúng thứ tự.
   * - Lọc nâng cao chỉ có tác dụng ở chế độ tìm theo từ khóa.
    * - Gửi `page`/`limit` khi chuyển trang; backend mặc định 20 kết quả mỗi trang.
   */
  toDiscoveryParams(state: RestaurantSearchState): Record<string, string | number> {
    const params: Record<string, string | number> = {
      radiusMeters: Math.min(
        MAX_RADIUS_M,
        Math.max(MIN_RADIUS_M, Math.round(state.radiusM || MIN_RADIUS_M))
      ),
    };

    if (state.mode === 'KEYWORD') {
      const keyword = state.query.trim();
      if (keyword.length >= 2) params.q = keyword.slice(0, 160);
    }
    if (state.mode === 'BOUNDS') {
      if (isBoundsUsable(state.bounds)) {
        params.north = state.bounds.north;
        params.south = state.bounds.south;
        params.east = state.bounds.east;
        params.west = state.bounds.west;
      }
    } else {
      const lat = toNullableNumber(state.lat);
      const lng = toNullableNumber(state.lng);
      if (lat !== null && lng !== null) {
        params.lat = lat;
        params.lng = lng;
      }
    }

    if (state.dietPattern === 'VEGAN' || state.dietPattern === 'LACTO_OVO') {
      params.dietPattern = state.dietPattern;
    }

    if (state.mode === 'KEYWORD') {
      const advanced = state.advanced;
      const minPrice = toIntInRange(advanced.minPrice, 0, 4);
      if (minPrice !== undefined) params.minPrice = minPrice;
      const maxPrice = toIntInRange(advanced.maxPrice, 0, 4);
      if (maxPrice !== undefined) params.maxPrice = maxPrice;
      const minRating = toNumberInRange(advanced.minRating, 2, 4.5);
      if (minRating !== undefined) params.minRating = minRating;
      if (advanced.openState === 'now' || advanced.openState === '24h') {
        params.openState = advanced.openState;
      }
      const days: readonly string[] = Object.values(RestaurantWeekday);
      if (advanced.openOnDay && days.includes(advanced.openOnDay)) {
        params.openOnDay = advanced.openOnDay;
      }
      const openAtHour = toIntInRange(advanced.openAtHour, 0, 23);
      if (openAtHour !== undefined) params.openAtHour = openAtHour;
    }

    if (state.locationSource === 'MANUAL' || state.locationSource === 'DEVICE') {
      params.locationSource = state.locationSource;
    }
    if (state.locationConsent !== undefined && state.locationSource === 'DEVICE') {
      params.locationConsent = state.locationConsent ? 'true' : 'false';
    }
    if (state.page !== undefined) params.page = state.page;
    if (state.limit !== undefined) params.limit = state.limit;

    return params;
  }
}

export const restaurantMapper = new RestaurantMapper();
