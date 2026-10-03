import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import api from '@/lib/axios';
import { restaurantApi } from './restaurant.api';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { RestaurantSearchState } from '../types/restaurant.model';
import type { RestaurantListResponseDto } from '../types/restaurant.dto';

function state(overrides: Partial<RestaurantSearchState> = {}): RestaurantSearchState {
  return {
    mode: 'NEARBY',
    radiusM: 5000,
    query: '',
    advanced: {},
    ...overrides,
  };
}

const listResponse: RestaurantListResponseDto = {
  success: true,
  data: [
    {
      id: 'res-gv-1',
      name: 'Cơm Chay Thiện Duyên',
      address: '456 Quang Trung, Phường 10, Gò Vấp, TP.HCM',
      latitude: 10.8285,
      longitude: 106.6432,
      distanceMeters: 800,
      dietTags: ['VEGAN'],
      source: 'INTERNAL',
    },
  ],
  meta: {
    page: 1,
    limit: 20,
    total: 1,
    provider: 'fake',
    providerResultLimit: 200,
    externalDataUnavailable: false,
    resultsTruncated: false,
    locationStored: false,
  },
};

describe('restaurantApi — discovery theo chế độ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getNearby ở mode NEARBY gửi đúng radiusMeters, lat, lng', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: listResponse });

    const result = await restaurantApi.getNearby(
      state({ mode: 'NEARBY', lat: 10.8214, lng: 106.6381, radiusM: 3000 })
    );

    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.RESTAURANTS.NEARBY, {
      params: { radiusMeters: 3000, lat: 10.8214, lng: 106.6381 },
      silent: true,
    });

    expect(result.restaurants).toHaveLength(1);
    expect(result.restaurants[0].name).toBe('Cơm Chay Thiện Duyên');
    expect(result.restaurants[0].distanceLabel).toBe('800 m');
    expect(result.meta.provider).toBe('fake');
    expect(result.meta.locationStored).toBe(false);
  });

  it('getNearby ở mode BOUNDS gửi đủ bốn mốc, không gửi lat/lng', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: listResponse });

    await restaurantApi.getNearby(
      state({ mode: 'BOUNDS', bounds: { north: 10.9, south: 10.7, east: 106.9, west: 106.6 } })
    );

    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.RESTAURANTS.NEARBY, {
      params: { radiusMeters: 5000, north: 10.9, south: 10.7, east: 106.9, west: 106.6 },
      silent: true,
    });
  });

  it('search với từ khóa hợp lệ gọi /restaurants/search kèm q', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: listResponse });

    const result = await restaurantApi.search(
      state({ mode: 'KEYWORD', lat: 10.8214, lng: 106.6381, radiusM: 2000, query: 'phở' })
    );

    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.RESTAURANTS.SEARCH, {
      params: { radiusMeters: 2000, q: 'phở' },
      silent: true,
    });
    expect(result.restaurants).toHaveLength(1);
  });

  it('search truyền đủ 6 tham số lọc nâng cao', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: listResponse });

    await restaurantApi.search(
      state({
        mode: 'KEYWORD',
        query: 'chay',
        advanced: {
          minPrice: 1,
          maxPrice: 3,
          minRating: 4,
          openState: 'now',
          openOnDay: 'sat',
          openAtHour: 19,
        },
      })
    );

    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.RESTAURANTS.SEARCH, {
      params: {
        radiusMeters: 5000,
        q: 'chay',
        minPrice: 1,
        maxPrice: 3,
        minRating: 4,
        openState: 'now',
        openOnDay: 'sat',
        openAtHour: 19,
      },
      silent: true,
    });
  });

  it('search với từ khóa quá ngắn tự chuyển tiếp sang nearby', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: listResponse });

    await restaurantApi.search(
      state({ mode: 'KEYWORD', lat: 10.8214, lng: 106.6381, radiusM: 2000, query: ' ' })
    );

    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.RESTAURANTS.NEARBY, {
      params: { radiusMeters: 2000, lat: 10.8214, lng: 106.6381 },
      silent: true,
    });
  });

  it('không gửi page/limit cho discovery', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: listResponse });

    await restaurantApi.getNearby(state({ mode: 'NEARBY', lat: 1, lng: 2 }));

    const params = spy.mock.calls[0][1]?.params as Record<string, unknown>;
    expect(params).not.toHaveProperty('page');
    expect(params).not.toHaveProperty('limit');
  });

  it('gửi locationSource và locationConsent khi dùng vị trí thiết bị', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: listResponse });

    await restaurantApi.getNearby(
      state({
        mode: 'NEARBY',
        lat: 10.82,
        lng: 106.63,
        locationSource: 'DEVICE',
        locationConsent: true,
      })
    );

    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.RESTAURANTS.NEARBY, {
      params: {
        radiusMeters: 5000,
        lat: 10.82,
        lng: 106.63,
        locationSource: 'DEVICE',
        locationConsent: 'true',
      },
      silent: true,
    });
  });

  it('không rò rỉ DTO ra ngoài — trả RestaurantDiscoveryResult', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: listResponse });

    const result = await restaurantApi.getNearby(state({ mode: 'NEARBY', lat: 1, lng: 2 }));

    expect(Object.keys(result).sort()).toEqual(['meta', 'notices', 'restaurants']);
    expect(result.restaurants[0]).toHaveProperty('hasCoordinates');
    expect(result.restaurants[0]).toHaveProperty('sourceLabel');
    expect(result.meta).toHaveProperty('providerResultLimit');
  });

  it('sinh notices khi backend báo provider suy giảm', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        ...listResponse,
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          provider: 'google',
          providerResultLimit: 200,
          externalDataUnavailable: true,
          resultsTruncated: true,
          locationStored: false,
        },
      },
    });

    const result = await restaurantApi.getNearby(state({ mode: 'NEARBY', lat: 1, lng: 2 }));

    // `PRIVACY` luôn có vì backend cam kết `locationStored: false` (SC-007).
    expect(result.notices.map((n) => n.kind)).toEqual(['UNAVAILABLE', 'TRUNCATED', 'PRIVACY']);
  });
});

describe('restaurantApi — geocode (FR-033)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gửi address đã trim và trả kết quả khi phân giải được', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          address: 'Hồ Gươm, Hà Nội',
          latitude: 21.0285,
          longitude: 105.8542,
          placeId: 'fake:abc',
          attribution: 'Dữ liệu minh hoạ',
        },
      },
    });

    const result = await restaurantApi.geocode('  Hồ Gươm, Hà Nội  ');

    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.LOCATION.GEOCODE, {
      params: { address: 'Hồ Gươm, Hà Nội' },
      silent: true,
    });
    expect(result.isAvailable).toBe(true);
    expect(result.lat).toBeCloseTo(21.0285);
    expect(result.label).toBe('Hồ Gươm, Hà Nội');
  });

  it('data null → isAvailable false và tọa độ null, KHÔNG bịa tọa độ mặc định', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { success: true, data: null, externalDataUnavailable: true },
    });

    const result = await restaurantApi.geocode('zzz qqq xxx');

    expect(result.isAvailable).toBe(false);
    expect(result.lat).toBeNull();
    expect(result.lng).toBeNull();
  });
});

describe('restaurantApi — đề xuất quán', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gửi payload đúng tên field của submitRestaurantSchema', async () => {
    const spy = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: { success: true, data: { id: 'new-1', status: 'PENDING' } },
    });

    await restaurantApi.submitRestaurant({
      name: 'Quán chay Mới',
      address: '123 Phố Huế, Hà Nội',
      latitude: 21.0285,
      longitude: 105.8542,
      dietTags: ['VEGAN'],
    });

    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.RESTAURANTS.SUBMIT, {
      name: 'Quán chay Mới',
      address: '123 Phố Huế, Hà Nội',
      latitude: 21.0285,
      longitude: 105.8542,
      dietTags: ['VEGAN'],
    });
  });
});
