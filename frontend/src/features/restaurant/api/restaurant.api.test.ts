import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import api from '@/lib/axios';
import { restaurantApi } from './restaurant.api';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';

describe('restaurantApi Live REST Client & Query Translation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gọi GET /restaurants/nearby với đúng tham số radiusMeters, lat, lng', async () => {
    const mockData = {
      success: true,
      data: [
        {
          id: 'res-gv-1',
          name: 'Cơm Chay Thiện Duyên',
          address: '456 Quang Trung, Phường 10, Gò Vấp, TP.HCM',
          lat: 10.8285,
          lng: 106.6432,
          distanceMeters: 800,
          dietTags: ['VEGAN'],
          dishes: ['Cơm tấm sườn chay'],
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockData });

    const result = await restaurantApi.getNearby({
      lat: 10.8214,
      lng: 106.6381,
      radiusM: 3000,
    });

    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.RESTAURANTS.NEARBY, {
      params: {
        lat: 10.8214,
        lng: 106.6381,
        radiusMeters: 3000,
      },
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].name).toBe('Cơm Chay Thiện Duyên');
    expect(result.items[0].distanceM).toBe(800);
    expect(result.items[0].distanceLabel).toBe('800 m');
  });

  it('search có từ khóa >= 2 ký tự gọi GET /restaurants/search kèm param q', async () => {
    const mockData = {
      success: true,
      data: [
        {
          id: 'res-gv-1',
          name: 'Cơm Chay Thiện Duyên',
          address: '456 Quang Trung, Gò Vấp',
          lat: 10.8285,
          lng: 106.6432,
          dishes: ['Phở chay'],
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockData });

    const result = await restaurantApi.search({
      lat: 10.8214,
      lng: 106.6381,
      radiusM: 2000,
      query: 'phở',
    });

    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.RESTAURANTS.SEARCH, {
      params: {
        lat: 10.8214,
        lng: 106.6381,
        radiusMeters: 2000,
        q: 'phở',
      },
    });

    expect(result.items.length).toBe(1);
  });

  it('search không có từ khóa hợp lệ tự động chuyển tiếp sang nearby', async () => {
    const mockData = {
      success: true,
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };

    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockData });

    await restaurantApi.search({
      lat: 10.8214,
      lng: 106.6381,
      radiusM: 2000,
      query: ' ',
    });

    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.RESTAURANTS.NEARBY, {
      params: {
        lat: 10.8214,
        lng: 106.6381,
        radiusMeters: 2000,
      },
    });
  });
});
