import { BaseMapper, pickField, safeArray, safeEnum, safeNumber, safeString } from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type { GeocodeResponseDto, RestaurantDto, RestaurantListResponseDto } from '../types/restaurant.dto';
import type { Restaurant } from '../types/restaurant.model';
import { RestaurantStatus } from '@/common/enums';

const SOURCE_LABELS: Record<string, string> = {
  INTERNAL: 'Nội bộ',
  GOOGLE: 'Google',
};

const STATUS_LABELS: Record<RestaurantStatus, string> = {
  [RestaurantStatus.PENDING]: 'Chờ duyệt',
  [RestaurantStatus.PUBLISHED]: 'Đang hiển thị',
};

/** Mét → `850 m` / `2,3 km` (dấu phẩy Việt). */
export function formatDistance(distanceM: number | null): string {
  if (distanceM === null || Number.isNaN(distanceM) || distanceM < 0) return '';
  if (distanceM < 1000) return `${Math.round(distanceM)} m`;
  return `${(distanceM / 1000).toFixed(1).replace('.', ',')} km`;
}

/** RestaurantMapper — bản đọc (nearby/search/geocode), đồng bộ `frontend/.../restaurant.mapper.ts`. */
export class RestaurantMapper extends BaseMapper<RestaurantDto, Restaurant> {
  toModel(dto: RestaurantDto | null | undefined): Restaurant {
    const toNum = (val: unknown): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const parsed = safeNumber(val, NaN);
      return Number.isNaN(parsed) ? null : parsed;
    };
    const status = safeEnum(pickField(dto, ['status'], 'PUBLISHED'), RestaurantStatus, RestaurantStatus.PUBLISHED);
    const source = safeString(pickField(dto, ['source'], 'INTERNAL')).toUpperCase();
    const distanceM = toNum(pickField(dto, ['distanceM', 'distance_m'], null));
    return {
      id: safeString(pickField(dto, ['id'], '')),
      name: safeString(pickField(dto, ['name'], '')) || 'Quán chay',
      address: safeString(pickField(dto, ['address'], '')),
      lat: toNum(pickField(dto, ['lat', 'latitude'], null)),
      lng: toNum(pickField(dto, ['lng', 'longitude'], null)),
      distanceM,
      distanceLabel: formatDistance(distanceM),
      dishes: safeArray<string | null, string>(pickField(dto, ['dishes'], null), (dish) => safeString(dish)).filter(
        (dish) => dish.length > 0
      ),
      openingHours: safeString(pickField(dto, ['openingHours', 'opening_hours'], '')) || null,
      source,
      sourceLabel: SOURCE_LABELS[source] ?? source,
      status,
      statusLabel: STATUS_LABELS[status],
    };
  }

  toListModel(dto: RestaurantListResponseDto | null | undefined): PaginationResult<Restaurant> {
    const rawItems = pickField(dto, ['data'], null) as (RestaurantDto | null)[] | null;
    const items = this.toModelList(
      safeArray<RestaurantDto | null, RestaurantDto | null>(rawItems, (item) => item)
    ).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as RestaurantListResponseDto['meta'];
    return {
      items,
      metadata: {
        page: safeNumber(meta?.page, 1),
        limit: safeNumber(meta?.limit, 10),
        totalItems: safeNumber(meta?.total, items.length),
        totalPages: safeNumber(meta?.totalPages, 1),
      },
    };
  }

  toCoordinates(dto: GeocodeResponseDto | null | undefined): { lat: number | null; lng: number | null; label: string } {
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
}

export const restaurantMapper = new RestaurantMapper();
