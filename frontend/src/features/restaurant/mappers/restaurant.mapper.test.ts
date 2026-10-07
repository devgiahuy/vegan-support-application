import { describe, expect, it } from 'vitest';
import { formatDistance, restaurantMapper } from './restaurant.mapper';
import type { RestaurantListResponseDto } from '../types/restaurant.dto';
import { RestaurantStatus, RestaurantSource } from '@/common/enums';

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
      dietaryTags: ['VEGAN', 'LACTO_VEGETARIAN'],
      dishes: ['Bún bò Huế chay', null, ''],
      openingHours: '7:00 - 21:00',
      priceRange: '30.000đ - 60.000đ',
      phoneNumber: '0901234567',
      websiteUrl: 'https://chayannhien.vn',
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
  it('map quán đủ field + distanceLabel m + dietaryTags', () => {
    const result = restaurantMapper.toListModel(listEnvelope);
    expect(result.items).toHaveLength(2);
    const first = result.items[0];
    expect(first.name).toBe('Chay An Nhiên');
    expect(first.distanceLabel).toBe('850 m');
    expect(first.dietaryTags).toEqual(['VEGAN', 'LACTO_VEGETARIAN']);
    expect(first.dishes).toEqual(['Bún bò Huế chay']);
    expect(first.priceRange).toBe('30.000đ - 60.000đ');
    expect(first.phoneNumber).toBe('0901234567');
    expect(first.websiteUrl).toBe('https://chayannhien.vn');
    expect(first.source).toBe(RestaurantSource.INTERNAL);
    expect(first.sourceLabel).toBe('Cộng đồng VeggieConnect');
    expect(first.status).toBe(RestaurantStatus.PUBLISHED);
    expect(first.isStale).toBe(false);
  });

  it('snake_case + lat/lng alias + km + nguồn Google Places', () => {
    const result = restaurantMapper.toListModel(listEnvelope);
    const second = result.items[1];
    expect(second.lat).toBeCloseTo(10.762);
    expect(second.distanceLabel).toBe('2,3 km');
    expect(second.source).toBe(RestaurantSource.GOOGLE_PLACES);
    expect(second.sourceLabel).toBe('Google Places');
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

  it('toCoordinates chuyển đổi đúng geocode dto', () => {
    const coords = restaurantMapper.toCoordinates({
      success: true,
      data: { lat: 10.776, lng: 106.7, label: 'Bến Thành' },
      meta: null,
    });
    expect(coords.lat).toBeCloseTo(10.776);
    expect(coords.lng).toBeCloseTo(106.7);
    expect(coords.label).toBe('Bến Thành');
  });

  it('toSubmitDto và toReviewDto chuẩn hóa đúng payload', () => {
    const submitDto = restaurantMapper.toSubmitDto({
      name: 'Quán chay Mới',
      lat: 10.8,
      lng: 106.7,
      address: '123 Phố Huế',
      dietaryTags: ['VEGAN'],
      dishes: ['Cơm chay'],
      note: 'Quán mới mở',
    });
    expect(submitDto.name).toBe('Quán chay Mới');
    expect(submitDto.dietTags).toEqual(['VEGAN']);
    expect(submitDto.latitude).toBe(10.8);
    expect(submitDto).not.toHaveProperty('dishes');

    const reviewDto = restaurantMapper.toReviewDto('REJECT', 'Quán không phục vụ đồ chay');
    expect(reviewDto.decision).toBe('REJECTED');
    expect(reviewDto.reason).toBe('Quán không phục vụ đồ chay');
  });

  it('toCoordinates hỗ trợ latitude/longitude và address alias từ Backend', () => {
    const coords = restaurantMapper.toCoordinates({
      success: true,
      data: { latitude: 10.8214, longitude: 106.6381, address: 'Gò Vấp, TP.HCM' },
      meta: null,
    });
    expect(coords.lat).toBeCloseTo(10.8214);
    expect(coords.lng).toBeCloseTo(106.6381);
    expect(coords.label).toBe('Gò Vấp, TP.HCM');
  });

  it('toLocationQuery tạo strict parameters phù hợp backend', () => {
    const query = restaurantMapper.toLocationQuery({
      lat: 10.776,
      lng: 106.7,
      radiusM: 5000,
      query: 'phở chay',
      dietaryTags: ['VEGAN'],
    });
    expect(query).toEqual({
      radiusMeters: 5000,
      lat: 10.776,
      lng: 106.7,
      q: 'phở chay',
      dietPattern: 'VEGAN',
    });

    const emptyQuery = restaurantMapper.toLocationQuery({
      radiusM: 3000,
      query: ' ',
    });
    expect(emptyQuery).toEqual({
      radiusMeters: 3000,
    });
  });
});

describe('Live discovery contract regressions', () => {
  it('retains empty-result degradation and dietary suppression', () => {
    const result = restaurantMapper.toListModel({
      success: true,
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        externalDataUnavailable: true,
        externalResultsSuppressed: true,
        resultsTruncated: false,
      },
    });
    expect(result.externalDataUnavailable).toBe(true);
    expect(result.externalResultsSuppressed).toBe(true);
    expect(result.metadata.totalPages).toBe(0);
  });
  it('computes pagination and attributes SerpApi data correctly', () => {
    const result = restaurantMapper.toListModel({
      data: [
        {
          id: 'serpapi:abc',
          source: 'SERPAPI',
          attribution: 'Google Maps data via SerpApi',
          dietaryReviewed: false,
          status: 'APPROVED',
        },
      ],
      meta: { page: 1, limit: 20, total: 41 },
    });
    expect(result.metadata.totalPages).toBe(3);
    expect(result.metadata.hasNextPage).toBe(true);
    expect(result.items[0].source).toBe(RestaurantSource.SERPAPI);
    expect(result.items[0].attribution).toBe('Google Maps data via SerpApi');
    expect(result.items[0].dietaryReviewed).toBe(false);
    expect(result.items[0].status).toBe(RestaurantStatus.PUBLISHED);
  });
  it('preserves exact reported coordinates and device consent', () => {
    expect(
      restaurantMapper.toLocationQuery({
        lat: 10.875178124459689,
        lng: 106.80076348780484,
        radiusM: 5000,
        locationSource: 'DEVICE',
        locationConsent: true,
        page: 2,
        limit: 20,
      })
    ).toEqual({
      lat: 10.875178124459689,
      lng: 106.80076348780484,
      radiusMeters: 5000,
      locationSource: 'DEVICE',
      locationConsent: 'true',
      page: 2,
      limit: 20,
    });
  });
  it('requires coordinates and a reason for both decisions', () => {
    expect(() =>
      restaurantMapper.toSubmitDto({ name: 'Quán mới', address: 'Địa chỉ quán', dishes: [] })
    ).toThrow();
    expect(() => restaurantMapper.toReviewDto('APPROVE')).toThrow();
    expect(restaurantMapper.toReviewDto('APPROVE', 'Đã xem xét')).toEqual({
      decision: 'APPROVED',
      reason: 'Đã xem xét',
    });
  });
});
