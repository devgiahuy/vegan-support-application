import type { PaginationResult } from '@/types/api';
import type { LocationQuery, Restaurant, SubmitRestaurantInput } from '../types/restaurant.model';
import { GooglePlaceProvider } from '../providers/google-place.provider';
import {
  MockPlaceProvider,
  __resetRestaurantFixtures as resetMockFixtures,
  getQueueList,
  reviewQueued,
  submitToQueue,
} from '../providers/mock-place.provider';
import {
  PlaceErrorCode,
  PlaceProviderError,
  resolveProviderName,
  type PlaceProvider,
} from '../providers/place-provider';
import { haversineMeters } from '../providers/place-distance';
import { formatDistance } from '../mappers/restaurant.mapper';

/** Giữ tương thích import cũ (nay sống ở `providers/place-distance.ts`). */
export { haversineMeters };
export { __resetRestaurantFixtures };

function __resetRestaurantFixtures(): void {
  resetMockFixtures();
}

const googleProvider = new GooglePlaceProvider();
const mockProvider = new MockPlaceProvider();

let testProvider: PlaceProvider | null = null;

/**
 * Ghi đè provider cho test swap (SC-004). CHỈ dùng trong test — production
 * luôn đi qua `resolveProviderName()`.
 */
export function __overrideActiveProviderForTests(provider: PlaceProvider | null): void {
  testProvider = provider;
}

/** Điểm chọn nguồn duy nhất (contract §4, arch §12/§32). */
function activeProvider(): PlaceProvider {
  if (testProvider) return testProvider;
  return resolveProviderName() === 'google' ? googleProvider : mockProvider;
}

function normalizeKey(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Gom trùng đa nguồn (Q2, contract §3): cùng tên chuẩn hóa VÀ (cùng địa chỉ
 * chuẩn hóa HOẶC cách nhau ≤ 100m) → 1 bản, ưu tiên nguồn cộng đồng/Backend,
 * nhãn liệt kê đủ nguồn.
 */
function dedupePlaces(items: Restaurant[]): Restaurant[] {
  const merged: Restaurant[] = [];
  for (const item of items) {
    const nameKey = normalizeKey(item.name);
    const addrKey = normalizeKey(item.address);
    const dup =
      nameKey.length > 0
        ? merged.find((kept) => {
            if (normalizeKey(kept.name) !== nameKey) return false;
            if (normalizeKey(kept.address) === addrKey) return true;
            if (kept.lat !== null && kept.lng !== null && item.lat !== null && item.lng !== null) {
              return haversineMeters(kept.lat, kept.lng, item.lat, item.lng) <= 100;
            }
            return false;
          })
        : undefined;
    if (!dup) {
      merged.push(item);
      continue;
    }
    const base = dup.source === 'GOOGLE' && item.source !== 'GOOGLE' ? item : dup;
    const extra = base === dup ? item : dup;
    const labels = [base.sourceLabel, extra.sourceLabel].filter(
      (label, index, arr) => label.length > 0 && arr.indexOf(label) === index
    );
    Object.assign(dup, {
      ...base,
      address: base.address || extra.address,
      dishes: base.dishes.length > 0 ? base.dishes : extra.dishes,
      openingHours: base.openingHours ?? extra.openingHours,
      photos: base.photos.length > 0 ? base.photos : extra.photos,
      rating: base.rating ?? extra.rating,
      reviewCount: base.reviewCount ?? extra.reviewCount,
      googleMapsUri: base.googleMapsUri ?? extra.googleMapsUri,
      source: base.source,
      sourceLabel: labels.join(' · '),
    });
  }
  return merged;
}

function attachDistance(items: Restaurant[], query: LocationQuery): Restaurant[] {
  if (query.lat === undefined || query.lng === undefined) return items;
  return items.map((item) => {
    if (item.lat === null || item.lng === null) return item;
    const distanceM = Math.round(
      haversineMeters(query.lat ?? 0, query.lng ?? 0, item.lat, item.lng)
    );
    return { ...item, distanceM, distanceLabel: formatDistance(distanceM) };
  });
}

function sortByDistance(items: Restaurant[]): Restaurant[] {
  return [...items].sort((a, b) => {
    const da = typeof a.distanceM === 'number' ? a.distanceM : Number.POSITIVE_INFINITY;
    const db = typeof b.distanceM === 'number' ? b.distanceM : Number.POSITIVE_INFINITY;
    return da - db;
  });
}

function toPage(items: Restaurant[]): PaginationResult<Restaurant> {
  return {
    items,
    metadata: {
      page: 1,
      limit: 10,
      totalItems: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

/**
 * API quán chay — facade giữ chữ ký cho queries/components (FR-010).
 * Khám phá (nearby/search/detail/geocode) qua provider hiện tại;
 * gửi quán/hàng chờ/duyệt LUÔN dùng kho cộng đồng cục bộ tới khi có Backend.
 */
export const restaurantApi = {
  /** Quán gần vị trí (sắp theo khoảng cách). */
  getNearby: async (query: LocationQuery): Promise<PaginationResult<Restaurant>> => {
    const items = await activeProvider().searchNearby(query);
    return toPage(sortByDistance(attachDistance(dedupePlaces(items), query)));
  },

  /**
   * Tìm theo từ khóa.
   * Quy tắc món (T020): mock lọc substring trên `dishes` nội bộ; Google tin
   * Text Search phía server (quán Google rỗng `dishes` nên KHÔNG lọc hậu kỳ —
   * nếu không sẽ loại hết kết quả đúng từ khóa, trái acceptance US2).
   * Nearby giữ toàn bộ bất kể `dishes` rỗng. Giữ thứ tự liên quan của provider.
   */
  search: async (query: LocationQuery): Promise<PaginationResult<Restaurant>> => {
    const items = await activeProvider().search(query);
    return toPage(attachDistance(dedupePlaces(items), query));
  },

  /** Chi tiết 1 quán — không còn thì ném PLACE_NOT_FOUND để UI hiện trạng thái lỗi. */
  getDetail: async (id: string): Promise<Restaurant> => {
    const found = await activeProvider().getDetails(id);
    if (!found) throw new PlaceProviderError(PlaceErrorCode.PLACE_NOT_FOUND);
    return found;
  },

  /** Gửi quán mới vào chờ — không hiện công khai (kho cộng đồng cục bộ). */
  submitRestaurant: async (input: SubmitRestaurantInput): Promise<Restaurant> => {
    return submitToQueue(input);
  },

  /** Phân giải địa chỉ text → tọa độ (provider hiện tại). */
  geocode: async (
    address: string
  ): Promise<{ lat: number | null; lng: number | null; label: string }> => {
    return activeProvider().geocode(address);
  },

  /** Hàng chờ admin (kho cộng đồng cục bộ). */
  getQueue: async (): Promise<PaginationResult<Restaurant>> => {
    return toPage(await getQueueList());
  },

  /** Admin duyệt/từ chối (kho cộng đồng cục bộ). */
  reviewRestaurant: async (
    id: string,
    decision: 'APPROVE' | 'REJECT',
    reason: string
  ): Promise<Restaurant> => {
    void reason;
    return reviewQueued(id, decision);
  },
};
