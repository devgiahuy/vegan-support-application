import type { PaginationResult } from '@/types/api';
import type { RestaurantDto } from '../types/restaurant.dto';
import type { LocationQuery, Restaurant, SubmitRestaurantInput } from '../types/restaurant.model';
import { restaurantMapper } from '../mappers/restaurant.mapper';
import {
  geocodeFixture,
  restaurantDetailFixture,
  restaurantListFixture,
  restaurantQueueFixture,
} from '../__fixtures__/restaurant-fixtures';

/**
 * API quán chay — PHASE SCAFFOLD: đọc fixture, 0 request mạng, 0 gọi maps ngoài.
 * Backend còn `PLANNED` (không có schema swagger) nên 7 hàm dưới MÔ PHỎNG
 * đúng signature dự kiến live.
 *
 * Ngày nối live (TODO(BE-READY)): reconfirm shape 7 endpoint với swagger thật,
 * sửa mapper nếu lệch, thay thân hàm bằng axios qua `API_ENDPOINTS.RESTAURANTS`
 * / `LOCATION` / `ADMIN_RESTAURANTS`, giữ nguyên chữ ký + kiểu trả về —
 * queries/components KHÔNG đổi (kể cả haversine sort). Đồng thời chuyển
 * `__fixtures__` sang test-only hoặc xóa khỏi bundle.
 */
export const USE_FIXTURES = true;

const SIMULATED_DELAY_MS = 300;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Haversine mét giữa 2 tọa độ (dùng sắp xếp ở tầng api, giữ nguyên khi live). */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const earthM = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthM * Math.asin(Math.sqrt(a));
}

function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

let queueStore: (RestaurantDto | null)[] = clone(restaurantQueueFixture.data ?? []);
let submittedStore: (RestaurantDto | null)[] = [];

export function __resetRestaurantFixtures(): void {
  queueStore = clone(restaurantQueueFixture.data ?? []);
  submittedStore = [];
}

function withDistance(
  items: (RestaurantDto | null)[],
  query: LocationQuery
): (RestaurantDto | null)[] {
  if (query.lat === undefined || query.lng === undefined) return items;
  return items.map((item) => {
    if (!item) return item;
    const lat = Number(item.lat ?? item.latitude ?? NaN);
    const lng = Number(item.lng ?? item.longitude ?? NaN);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return item;
    return {
      ...item,
      distanceM: Math.round(haversineMeters(query.lat ?? 0, query.lng ?? 0, lat, lng)),
    };
  });
}

function applyDishFilter(
  items: (RestaurantDto | null)[],
  dishQuery: string
): (RestaurantDto | null)[] {
  const keyword = normalizeText(dishQuery.trim());
  if (!keyword) return items;
  return items.filter((item) =>
    (item?.dishes ?? []).some((dish) => dish && normalizeText(dish).includes(keyword))
  );
}

export const restaurantApi = {
  /** `GET /restaurants/nearby` (fixture + haversine sort). */
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

  /** `GET /restaurants/search` (fixture + lọc món không dấu). */
  search: async (query: LocationQuery): Promise<PaginationResult<Restaurant>> => {
    await delay();
    const source = applyDishFilter(
      withDistance(clone(restaurantListFixture.data ?? []), query),
      query.query
    );
    return restaurantMapper.toListModel({
      success: true,
      data: source,
      meta: { page: 1, limit: 10, total: source.length, totalPages: 1 },
    });
  },

  /** `GET /restaurants/:id` (fixture). */
  getDetail: async (id: string): Promise<Restaurant> => {
    await delay();
    return restaurantMapper.toSingleModel(restaurantDetailFixture(id));
  },

  /** `POST /restaurants` (fixture, vào chờ — không hiện công khai). */
  submitRestaurant: async (input: SubmitRestaurantInput): Promise<Restaurant> => {
    await delay();
    const created: RestaurantDto = {
      id: `sub-${Date.now().toString(36)}`,
      name: input.name,
      address: input.address,
      lat: input.lat,
      lng: input.lng,
      dishes: input.dishes,
      status: 'PENDING',
    };
    submittedStore = [created, ...submittedStore];
    queueStore = [created, ...queueStore];
    return restaurantMapper.toSingleModel({ success: true, data: created, meta: null });
  },

  /** `GET /location/geocode` (fixture vài địa chỉ mẫu). */
  geocode: async (
    address: string
  ): Promise<{ lat: number | null; lng: number | null; label: string }> => {
    await delay();
    return restaurantMapper.toCoordinates(geocodeFixture(address));
  },

  /** `GET /admin/restaurants` (fixture). */
  getQueue: async (): Promise<PaginationResult<Restaurant>> => {
    await delay();
    const source = clone(queueStore);
    return restaurantMapper.toQueueModel({
      success: true,
      data: source,
      meta: { page: 1, limit: 10, total: source.length, totalPages: 1 },
    });
  },

  /** `PATCH /admin/restaurants/:id/review` (fixture, duyệt hiện công khai). */
  reviewRestaurant: async (
    id: string,
    decision: 'APPROVE' | 'REJECT',
    reason: string
  ): Promise<Restaurant> => {
    await delay();
    void reason;
    queueStore = queueStore.filter((item) => item?.id !== id);
    return restaurantMapper.toReviewedModel({
      success: true,
      data: { id, status: decision === 'APPROVE' ? 'PUBLISHED' : 'PENDING' },
      meta: null,
    });
  },
};
