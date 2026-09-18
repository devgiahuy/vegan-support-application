import { describe, expect, it } from 'vitest';
import { formatDistance, restaurantMapper } from './restaurant.mapper';
import type { RestaurantListResponseDto } from '../types/restaurant.dto';
import { RestaurantStatus } from '@/common/enums';

const listEnvelope: RestaurantListResponseDto = {
  success: true,
  data: [
    {
      id: 'r1',
      name: 'Chay An Nhiên',
      address: '12 Hàng Tre, Hà Nội',
      lat: 21.033,
      lng: 105.854,
      distanceM: 850,
      dishes: ['Bún bò Huế chay', null, ''],
      openingHours: '7:00 - 21:00',
      source: 'INTERNAL',
      fetchedAt: new Date().toISOString(),
      status: 'PUBLISHED',
    },
    {
      id: 'r2',
      name: 'Quán cũ',
      latitude: '10.762',
      longitude: '106.682',
      distance_m: '2300',
      source: 'GOOGLE',
      status: 'PENDING',
    },
    null,
  ],
  meta: { page: 1, limit: 10, total: 2, total_pages: 1 },
};

describe('RestaurantMapper list', () => {
  it('map quán đủ field + distanceLabel m', () => {
    const result = restaurantMapper.toListModel(listEnvelope);
    expect(result.items).toHaveLength(2);
    const first = result.items[0];
    expect(first.name).toBe('Chay An Nhiên');
    expect(first.distanceLabel).toBe('850 m');
    expect(first.dishes).toEqual(['Bún bò Huế chay']);
    expect(first.sourceLabel).toBe('Nội bộ');
    expect(first.status).toBe(RestaurantStatus.PUBLISHED);
    expect(first.isStale).toBe(false);
  });

  it('snake_case + lat/lng alias + km + nguồn Google', () => {
    const result = restaurantMapper.toListModel(listEnvelope);
    const second = result.items[1];
    expect(second.lat).toBeCloseTo(10.762);
    expect(second.distanceLabel).toBe('2,3 km');
    expect(second.sourceLabel).toBe('Google');
    expect(second.statusLabel).toBe('Chờ duyệt');
  });

  it('envelope null → list rỗng', () => {
    const result = restaurantMapper.toListModel(null);
    expect(result.items).toEqual([]);
    expect(result.metadata.totalItems).toBe(0);
  });
});

describe('formatDistance', () => {
  it('m / km / null / âm / NaN', () => {
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(999)).toBe('999 m');
    expect(formatDistance(1500)).toBe('1,5 km');
    expect(formatDistance(null)).toBe('');
    expect(formatDistance(-5)).toBe('');
    expect(formatDistance(NaN)).toBe('');
  });
});

describe('RestaurantMapper single/queue/review', () => {
  it('toSingleModel + fetchedAt cũ → isStale', () => {
    const item = restaurantMapper.toSingleModel({
      success: true,
      data: { id: 'r', fetchedAt: '2020-01-01T00:00:00.000Z' },
      meta: null,
    });
    expect(item.isStale).toBe(true);
    expect(item.name).toBe('Quán chay');
  });

  it('toQueueModel lọc rỗng + toReviewedModel', () => {
    const queue = restaurantMapper.toQueueModel({
      success: true,
      data: [{ id: 'q1', status: 'PENDING' }, { id: '' }],
      meta: null,
    });
    expect(queue.items.map((i) => i.id)).toEqual(['q1']);
    const reviewed = restaurantMapper.toReviewedModel({
      success: true,
      data: { id: 'q1', status: 'PUBLISHED' },
      meta: null,
    });
    expect(reviewed.status).toBe(RestaurantStatus.PUBLISHED);
  });

  it('toCoordinates đọc lat/lng + label, thiếu → null', () => {
    expect(
      restaurantMapper.toCoordinates({
        success: true,
        data: { lat: '21.0', lng: 105.8, label: 'Hà Nội' },
        meta: null,
      })
    ).toEqual({ lat: 21, lng: 105.8, label: 'Hà Nội' });
    expect(restaurantMapper.toCoordinates(null)).toEqual({ lat: null, lng: null, label: '' });
    expect(
      restaurantMapper.toCoordinates({ success: true, data: { lat: 'abc' }, meta: null }).lat
    ).toBeNull();
  });

  it('toSubmitDto bỏ rỗng + toReviewDto', () => {
    expect(
      restaurantMapper.toSubmitDto({ name: 'Q', address: 'ĐC đầy đủ', dishes: [], note: '' })
    ).toEqual({ name: 'Q', address: 'ĐC đầy đủ' });
    expect(
      restaurantMapper.toSubmitDto({
        name: 'Q',
        address: 'ĐC đầy đủ',
        lat: 21,
        lng: 105.8,
        dishes: ['Bún'],
        note: 'Ngon',
      })
    ).toEqual({
      name: 'Q',
      address: 'ĐC đầy đủ',
      lat: 21,
      lng: 105.8,
      dishes: ['Bún'],
      note: 'Ngon',
    });
    expect(restaurantMapper.toReviewDto('REJECT', 'Xa')).toEqual({
      decision: 'REJECT',
      reason: 'Xa',
    });
  });

  it('status lạ → PUBLISHED, nguồn lạ giữ nguyên', () => {
    const item = restaurantMapper.toSingleModel({
      success: true,
      data: { id: 'r', status: 'GHOST', source: 'YELP' },
      meta: null,
    });
    expect(item.status).toBe(RestaurantStatus.PUBLISHED);
    expect(item.sourceLabel).toBe('YELP');
  });

  it('toLocationQuery: địa chỉ ưu tiên, thiếu thì tọa độ', () => {
    expect(
      restaurantMapper.toLocationQuery({ addressText: '  Hồ Gươm  ', radiusM: 5000, query: '' })
    ).toEqual({ address: 'Hồ Gươm', radius: 5000 });
    expect(
      restaurantMapper.toLocationQuery({ lat: 21, lng: 105.8, radiusM: 3000, query: 'bún' })
    ).toEqual({
      lat: 21,
      lng: 105.8,
      radius: 3000,
      q: 'bún',
    });
  });

  it('openingHours rỗng → null, submittedBy map tên', () => {
    const item = restaurantMapper.toSingleModel({
      success: true,
      data: { id: 'r', openingHours: '', submittedBy: { displayName: 'An' } },
      meta: null,
    });
    expect(item.openingHours).toBeNull();
    expect(item.submittedByName).toBe('An');
  });

  it('dishes toàn rỗng → mảng rỗng, distanceM thiếu → label rỗng', () => {
    const item = restaurantMapper.toSingleModel({
      success: true,
      data: { id: 'r', dishes: [null, ''] },
      meta: null,
    });
    expect(item.dishes).toEqual([]);
    expect(item.distanceM).toBeNull();
    expect(item.distanceLabel).toBe('');
    expect(item.lat).toBeNull();
  });
});
