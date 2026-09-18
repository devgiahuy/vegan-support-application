import type { LocationQuery, Restaurant, SubmitRestaurantInput } from '../types/restaurant.model';
import type { RestaurantDto } from '../types/restaurant.dto';
import { restaurantMapper } from '../mappers/restaurant.mapper';
import {
  geocodeFixture,
  restaurantDetailFixture,
  restaurantListFixture,
  restaurantQueueFixture,
} from '../__fixtures__/restaurant-fixtures';
import { haversineMeters } from './place-distance';
import type { PlaceProvider } from './place-provider';

const SIMULATED_DELAY_MS = 300;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
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

function sortByDistance(items: (RestaurantDto | null)[]): (RestaurantDto | null)[] {
  return [...items].sort((a, b) => {
    const da = typeof a?.distanceM === 'number' ? a.distanceM : Number.POSITIVE_INFINITY;
    const db = typeof b?.distanceM === 'number' ? b.distanceM : Number.POSITIVE_INFINITY;
    return da - db;
  });
}

let queueStore: (RestaurantDto | null)[] = clone(restaurantQueueFixture.data ?? []);
let submittedStore: (RestaurantDto | null)[] = [];

/** Reset kho fixture (dùng cho test). */
export function __resetRestaurantFixtures(): void {
  queueStore = clone(restaurantQueueFixture.data ?? []);
  submittedStore = [];
}

/**
 * MockPlaceProvider — nguồn giả cho dev/test/khi thiếu key (contract §5,
 * tài liệu kiến trúc §39). Chữ ký giống hệt Google provider (FR-010).
 */
export class MockPlaceProvider implements PlaceProvider {
  readonly name = 'mock' as const;

  async searchNearby(query: LocationQuery): Promise<Restaurant[]> {
    await delay();
    const source = sortByDistance(withDistance(clone(restaurantListFixture.data ?? []), query));
    return restaurantMapper.toListModel({
      success: true,
      data: source,
      meta: { page: 1, limit: 10, total: source.length, totalPages: 1 },
    }).items;
  }

  async search(query: LocationQuery): Promise<Restaurant[]> {
    await delay();
    const source = applyDishFilter(
      withDistance(clone(restaurantListFixture.data ?? []), query),
      query.query
    );
    return restaurantMapper.toListModel({
      success: true,
      data: source,
      meta: { page: 1, limit: 10, total: source.length, totalPages: 1 },
    }).items;
  }

  async getDetails(placeId: string): Promise<Restaurant | null> {
    await delay();
    const found = restaurantMapper.toSingleModel(restaurantDetailFixture(placeId));
    return found.id.length > 0 ? found : null;
  }

  async geocode(
    address: string
  ): Promise<{ lat: number | null; lng: number | null; label: string }> {
    await delay();
    return restaurantMapper.toCoordinates(geocodeFixture(address));
  }
}

/**
 * Luồng cộng đồng (gửi quán/hàng chờ/duyệt) — LUÔN dùng kho cục bộ này cho tới
 * khi Backend thật tồn tại, bất kể provider khám phá đang là gì (016 giữ nguyên).
 */
export async function submitToQueue(input: SubmitRestaurantInput): Promise<Restaurant> {
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
}

export async function getQueueList(): Promise<Restaurant[]> {
  await delay();
  const source = clone(queueStore);
  return restaurantMapper.toQueueModel({
    success: true,
    data: source,
    meta: { page: 1, limit: 10, total: source.length, totalPages: 1 },
  }).items;
}

export async function reviewQueued(
  id: string,
  decision: 'APPROVE' | 'REJECT'
): Promise<Restaurant> {
  await delay();
  queueStore = queueStore.filter((item) => item?.id !== id);
  return restaurantMapper.toReviewedModel({
    success: true,
    data: { id, status: decision === 'APPROVE' ? 'PUBLISHED' : 'PENDING' },
    meta: null,
  });
}
