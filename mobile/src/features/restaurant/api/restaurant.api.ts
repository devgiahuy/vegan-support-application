import type { PaginationResult } from '@/types/api';
import type { RestaurantDto } from '../types/restaurant.dto';
import type { LocationQuery, Restaurant } from '../types/restaurant.model';
import { restaurantMapper } from '../mappers/restaurant.mapper';
import { geocodeFixture, restaurantListFixture } from '../__fixtures__/restaurant-fixtures';

/**
 * API quán chay — PHASE SCAFFOLD: đọc fixture, 0 request mạng, 0 gọi maps ngoài.
 * Đồng bộ `frontend/src/features/restaurant/api/restaurant.api.ts` (backend còn
 * `PLANNED`). Mọi tính toán khoảng cách/lọc chạy y hệt logic web để giữ hành vi nhất quán.
 */
const SIMULATED_DELAY_MS = 300;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Haversine mét giữa 2 tọa độ. */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const earthM = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthM * Math.asin(Math.sqrt(a));
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function withDistance(items: (RestaurantDto | null)[], query: LocationQuery): (RestaurantDto | null)[] {
  if (query.lat === undefined || query.lng === undefined) return items;
  return items.map((item) => {
    if (!item) return item;
    const lat = Number(item.lat ?? item.latitude ?? NaN);
    const lng = Number(item.lng ?? item.longitude ?? NaN);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return item;
    return { ...item, distanceM: Math.round(haversineMeters(query.lat ?? 0, query.lng ?? 0, lat, lng)) };
  });
}

function applyDishFilter(items: (RestaurantDto | null)[], dishQuery: string): (RestaurantDto | null)[] {
  const keyword = normalizeText(dishQuery.trim());
  if (!keyword) return items;
  return items.filter((item) => (item?.dishes ?? []).some((dish) => dish && normalizeText(dish).includes(keyword)));
}

export const restaurantApi = {
  /** Quán gần vị trí (fixture + sắp xếp haversine). */
  getNearby: async (query: LocationQuery): Promise<PaginationResult<Restaurant>> => {
    await delay();
    const source = withDistance(clone(restaurantListFixture.data ?? []), query);
    const sorted = [...source].sort((a, b) => {
      const da = typeof a?.distanceM === 'number' ? a.distanceM : Number.POSITIVE_INFINITY;
      const db = typeof b?.distanceM === 'number' ? b.distanceM : Number.POSITIVE_INFINITY;
      return da - db;
    });
    return restaurantMapper.toListModel({
      success: true,
      data: sorted,
      meta: { page: 1, limit: 10, total: sorted.length, totalPages: 1 },
    });
  },

  /** Tìm theo món (fixture, lọc không dấu) + sắp xếp khoảng cách. */
  search: async (query: LocationQuery): Promise<PaginationResult<Restaurant>> => {
    await delay();
    const withDist = withDistance(clone(restaurantListFixture.data ?? []), query);
    const filtered = applyDishFilter(withDist, query.query);
    const sorted = [...filtered].sort((a, b) => {
      const da = typeof a?.distanceM === 'number' ? a.distanceM : Number.POSITIVE_INFINITY;
      const db = typeof b?.distanceM === 'number' ? b.distanceM : Number.POSITIVE_INFINITY;
      return da - db;
    });
    return restaurantMapper.toListModel({
      success: true,
      data: sorted,
      meta: { page: 1, limit: 10, total: sorted.length, totalPages: 1 },
    });
  },

  /** Geocode địa chỉ text (fixture vài mẫu). */
  geocode: async (address: string): Promise<{ lat: number | null; lng: number | null; label: string }> => {
    await delay();
    return restaurantMapper.toCoordinates(geocodeFixture(address));
  },
};
