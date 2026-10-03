import { describe, expect, it } from 'vitest';
import { formatDistance, restaurantMapper } from './restaurant.mapper';
import type { RestaurantListResponseDto } from '../types/restaurant.dto';
import {
  DietPattern,
  RestaurantOpenState,
  RestaurantSource,
  RestaurantStatus,
} from '@/common/enums';
import type { RestaurantSearchState } from '../types/restaurant.model';
import { MIN_RADIUS_M, MAX_RADIUS_M, DEFAULT_RADIUS_M } from '../schemas/restaurant.schema';

function baseState(overrides: Partial<RestaurantSearchState> = {}): RestaurantSearchState {
  return {
    mode: 'NEARBY',
    radiusM: 5000,
    query: '',
    advanced: {},
    ...overrides,
  };
}

describe('RestaurantMapper.toModel — field theo contract', () => {
  it('parse latitude/longitude dạng chuỗi và ưu tiên tên contract', () => {
    const fromContract = restaurantMapper.toModel({
      id: 'a',
      latitude: '10.8214',
      longitude: '106.6381',
      lat: 1,
      lng: 2,
    });
    expect(fromContract.lat).toBeCloseTo(10.8214);
    expect(fromContract.lng).toBeCloseTo(106.6381);

    const fromAlias = restaurantMapper.toModel({ id: 'a', lat: 10.5, lng: 106.5 });
    expect(fromAlias.lat).toBeCloseTo(10.5);
    expect(fromAlias.lng).toBeCloseTo(106.5);
  });

  it('thiếu tọa độ hoặc giá trị sai → hasCoordinates false, không ném lỗi', () => {
    const missing = restaurantMapper.toModel({ id: 'a' });
    expect(missing.lat).toBeNull();
    expect(missing.lng).toBeNull();
    expect(missing.hasCoordinates).toBe(false);

    const invalid = restaurantMapper.toModel({ id: 'a', latitude: 'abc', longitude: '' });
    expect(invalid.lat).toBeNull();
    expect(invalid.hasCoordinates).toBe(false);
  });

  it('distanceMeters ưu tiên distanceM rồi distance_m; format m/km', () => {
    expect(restaurantMapper.toModel({ id: 'a', distanceMeters: '850' }).distanceLabel).toBe(
      '850 m'
    );
    expect(restaurantMapper.toModel({ id: 'a', distanceM: 2300 }).distanceLabel).toBe('2,3 km');
    expect(restaurantMapper.toModel({ id: 'a', distance_m: '1500' }).distanceLabel).toBe('1,5 km');
    expect(restaurantMapper.toModel({ id: 'a' }).distanceLabel).toBe('');
    expect(restaurantMapper.toModel({ id: 'a', distanceMeters: -1 }).distanceLabel).toBe('');
  });

  it('rating/reviewCount null-safe và tạo nhãn sẵn', () => {
    const withRating = restaurantMapper.toModel({ id: 'a', rating: '4.5', reviewCount: 128 });
    expect(withRating.rating).toBeCloseTo(4.5);
    expect(withRating.ratingLabel).toBe('4,5');
    expect(withRating.reviewCountLabel).toBe('128 đánh giá');

    const without = restaurantMapper.toModel({ id: 'a' });
    expect(without.rating).toBeNull();
    expect(without.ratingLabel).toBe('');
    expect(without.reviewCountLabel).toBe('');
  });

  it('price là chuỗi của provider, ưu tiên price trước priceRange', () => {
    expect(restaurantMapper.toModel({ id: 'a', price: '$$' }).priceLabel).toBe('$$');
    expect(restaurantMapper.toModel({ id: 'a', priceRange: '30.000đ - 60.000đ' }).priceLabel).toBe(
      '30.000đ - 60.000đ'
    );
    expect(restaurantMapper.toModel({ id: 'a' }).priceLabel).toBeNull();
  });

  it('openState map enum và nhãn tiếng Việt', () => {
    const now = restaurantMapper.toModel({ id: 'a', openState: 'now' });
    expect(now.openState).toBe(RestaurantOpenState.NOW);
    expect(now.openStateLabel).toBe('Đang mở');

    const allDay = restaurantMapper.toModel({ id: 'a', openState: '24h' });
    expect(allDay.openState).toBe(RestaurantOpenState.TWENTY_FOUR_HOURS);
    expect(allDay.openStateLabel).toBe('Mở 24 giờ');

    const unknown = restaurantMapper.toModel({ id: 'a', openState: 'WEIRD' });
    expect(unknown.openState).toBeNull();
    expect(unknown.openStateLabel).toBe('');

    expect(restaurantMapper.toModel({ id: 'a' }).openState).toBeNull();
  });

  it('operatingHours map theo ngày và tạo openingHours để hiển thị', () => {
    const model = restaurantMapper.toModel({
      id: 'a',
      operatingHours: { monday: '08:00-22:00', tuesday: '08:00-22:00' },
    });
    expect(model.operatingHoursByDay).toEqual({
      monday: '08:00-22:00',
      tuesday: '08:00-22:00',
    });
    expect(model.openingHours).toContain('monday: 08:00-22:00');
  });

  it('operatingHours null → openingHoursByDay rỗng, không lỗi', () => {
    const model = restaurantMapper.toModel({ id: 'a', operatingHours: null });
    expect(model.operatingHoursByDay).toEqual({});
    expect(model.openingHours).toBeNull();
  });

  it('đọc dietTags theo contract, fallback dietaryTags, loại rỗng và loại trùng', () => {
    const fromContract = restaurantMapper.toModel({
      id: 'a',
      dietTags: ['VEGAN', 'LACTO_OVO', null, '', 'VEGAN'],
    });
    expect(fromContract.dietaryTags).toEqual(['VEGAN', 'LACTO_OVO']);
    expect(fromContract.dietaryTagLabels).toEqual(['Thuần chay (Vegan)', 'Chay có sữa và trứng']);

    const fromAlias = restaurantMapper.toModel({ id: 'a', dietaryTags: ['BUDDHIST'] });
    expect(fromAlias.dietaryTags).toEqual(['BUDDHIST']);
    expect(fromAlias.dietaryTagLabels).toEqual(['Chay kiểng Phật']);

    const unknownTag = restaurantMapper.toModel({ id: 'a', dietTags: ['KHAC'] });
    expect(unknownTag.dietaryTagLabels).toEqual(['KHAC']);
  });

  it('phone/website/thumbnailUrl/mapsUrl ưu tiên tên contract', () => {
    const model = restaurantMapper.toModel({
      id: 'a',
      phone: '0900000000',
      phoneNumber: '0111111111',
      website: 'https://new.vn',
      websiteUrl: 'https://old.vn',
      thumbnailUrl: 'https://img.vn/a.jpg',
      mapsUrl: 'https://maps.google.com/?cid=1',
    });
    expect(model.phoneNumber).toBe('0900000000');
    expect(model.websiteUrl).toBe('https://new.vn');
    expect(model.thumbnailUrl).toBe('https://img.vn/a.jpg');
    expect(model.mapsUrl).toBe('https://maps.google.com/?cid=1');
  });

  it('matchReasons lọc rỗng', () => {
    expect(
      restaurantMapper.toModel({ id: 'a', matchReasons: ['gần vị trí', null, ''] }).matchReasons
    ).toEqual(['gần vị trí']);
    expect(restaurantMapper.toModel({ id: 'a' }).matchReasons).toEqual([]);
  });
});

describe('RestaurantMapper.toModel — nguồn dữ liệu (sửa lỗi R-02)', () => {
  it('map đúng cả 4 nguồn của contract', () => {
    expect(restaurantMapper.toModel({ id: 'a', source: 'INTERNAL' }).source).toBe(
      RestaurantSource.INTERNAL
    );
    expect(restaurantMapper.toModel({ id: 'a', source: 'GOOGLE' }).source).toBe(
      RestaurantSource.GOOGLE
    );
    expect(restaurantMapper.toModel({ id: 'a', source: 'SERPAPI' }).source).toBe(
      RestaurantSource.SERPAPI
    );
    expect(restaurantMapper.toModel({ id: 'a', source: 'FAKE' }).source).toBe(
      RestaurantSource.FAKE
    );
  });

  it('nhãn nguồn bên ngoài KHÔNG được hiển thị như quán nội bộ', () => {
    expect(restaurantMapper.toModel({ id: 'a', source: 'INTERNAL' }).sourceLabel).toBe(
      'Cộng đồng VeggieConnect'
    );
    expect(restaurantMapper.toModel({ id: 'a', source: 'GOOGLE' }).sourceLabel).toBe('Google Maps');
    expect(restaurantMapper.toModel({ id: 'a', source: 'SERPAPI' }).sourceLabel).toBe(
      'SerpApi (dữ liệu Google Maps)'
    );
    expect(restaurantMapper.toModel({ id: 'a', source: 'FAKE' }).sourceLabel).toBe(
      'Dữ liệu minh hoạ'
    );
  });

  it('isExternal đúng với mọi nguồn ngoài INTERNAL', () => {
    expect(restaurantMapper.toModel({ id: 'a', source: 'INTERNAL' }).isExternal).toBe(false);
    for (const source of ['GOOGLE', 'SERPAPI', 'FAKE']) {
      expect(restaurantMapper.toModel({ id: 'a', source }).isExternal).toBe(true);
    }
  });

  it('nguồn lạ hoặc thiếu → mặc định INTERNAL an toàn', () => {
    expect(restaurantMapper.toModel({ id: 'a', source: 'UNKNOWN' }).source).toBe(
      RestaurantSource.INTERNAL
    );
    expect(restaurantMapper.toModel({ id: 'a' }).source).toBe(RestaurantSource.INTERNAL);
  });
});

describe('RestaurantMapper.toModel — cảnh báo chế độ ăn (FR-009)', () => {
  it('quán ngoài chưa được duyệt → requiresDietaryWarning true', () => {
    const model = restaurantMapper.toModel({
      id: 'a',
      source: 'GOOGLE',
      dietaryReviewed: false,
    });
    expect(model.dietaryReviewed).toBe(false);
    expect(model.requiresDietaryWarning).toBe(true);
  });

  it('quán ngoài đã được duyệt → không cảnh báo', () => {
    expect(
      restaurantMapper.toModel({ id: 'a', source: 'GOOGLE', dietaryReviewed: true })
        .requiresDietaryWarning
    ).toBe(false);
  });

  it('quán nội bộ không cần cảnh báo dù cờ thiếu', () => {
    const model = restaurantMapper.toModel({ id: 'a', source: 'INTERNAL' });
    expect(model.requiresDietaryWarning).toBe(false);
  });

  it('dietaryReviewed nhận cả chuỗi "true"/"false"', () => {
    expect(
      restaurantMapper.toModel({ id: 'a', source: 'FAKE', dietaryReviewed: 'true' }).dietaryReviewed
    ).toBe(true);
    expect(
      restaurantMapper.toModel({ id: 'a', source: 'FAKE', dietaryReviewed: 'false' })
        .requiresDietaryWarning
    ).toBe(true);
  });

  it('attribution được giữ nguyên', () => {
    expect(
      restaurantMapper.toModel({
        id: 'a',
        source: 'SERPAPI',
        attribution: 'Google Maps via SerpApi',
      }).attribution
    ).toBe('Google Maps via SerpApi');
  });
});

describe('RestaurantMapper.toModel — dữ liệu cũ và bản ghi nội bộ', () => {
  it('fetchedAt quá 30 ngày → isStale', () => {
    expect(
      restaurantMapper.toModel({ id: 'a', fetchedAt: '2020-01-01T00:00:00.000Z' }).isStale
    ).toBe(true);
    expect(restaurantMapper.toModel({ id: 'a', fetchedAt: new Date().toISOString() }).isStale).toBe(
      false
    );
  });

  it('giữ trạng thái kiểm duyệt cho màn hình quản trị', () => {
    const model = restaurantMapper.toModel({ id: 'a', status: 'PENDING' });
    expect(model.status).toBe(RestaurantStatus.PENDING);
    expect(model.statusLabel).toBe('Chờ duyệt');
    expect(restaurantMapper.toModel({ id: 'a' }).status).toBe(RestaurantStatus.PUBLISHED);
  });

  it('submittedByName lấy displayName', () => {
    expect(
      restaurantMapper.toModel({ id: 'a', submittedBy: { displayName: 'Lan Anh' } }).submittedByName
    ).toBe('Lan Anh');
    expect(restaurantMapper.toModel({ id: 'a' }).submittedByName).toBeNull();
  });

  it('id rỗng thì tên fallback và dishes lọc rỗng', () => {
    const model = restaurantMapper.toModel({ dishes: ['Phở chay', null, ''] });
    expect(model.name).toBe('Quán chay');
    expect(model.dishes).toEqual(['Phở chay']);
  });

  it('toModel(null) không ném lỗi', () => {
    expect(restaurantMapper.toModel(null).id).toBe('');
    expect(restaurantMapper.toModel(undefined).id).toBe('');
  });
});

describe('RestaurantMapper.toDiscoveryModel — meta và cảnh báo', () => {
  const baseEnvelope: RestaurantListResponseDto = {
    success: true,
    data: [
      { id: 'r1', name: 'Chay An Nhiên' },
      { id: 'r2', name: 'Quán Hai' },
    ],
    meta: { page: 1, limit: 20, total: 2 },
  };

  it('map meta 8 trường và giữ hasNextPage false vì discovery không phân trang', () => {
    const result = restaurantMapper.toDiscoveryModel(baseEnvelope);
    expect(result.restaurants).toHaveLength(2);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
    expect(result.meta.totalItems).toBe(2);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPrevPage).toBe(false);
  });

  it('dừng suy đoán totalPages — backend không gửi field này', () => {
    const withTotal = restaurantMapper.toDiscoveryModel(baseEnvelope);
    expect(withTotal.meta.totalPages).toBe(0);
  });

  it('map cờ provider và dịch nhãn provider', () => {
    const result = restaurantMapper.toDiscoveryModel({
      ...baseEnvelope,
      meta: {
        page: 1,
        limit: 20,
        total: 2,
        externalDataUnavailable: true,
        resultsTruncated: true,
        provider: 'serpapi',
        providerResultLimit: 200,
        locationStored: false,
      },
    });
    expect(result.meta.externalDataUnavailable).toBe(true);
    expect(result.meta.resultsTruncated).toBe(true);
    expect(result.meta.provider).toBe('serpapi');
    expect(result.meta.providerLabel).toBe('SerpApi');
    expect(result.meta.providerResultLimit).toBe(200);
    expect(result.meta.locationStored).toBe(false);
  });

  it('meta null → fallback an toàn và vẫn giữ đúng số lượng quán', () => {
    const result = restaurantMapper.toDiscoveryModel({ success: true, data: baseEnvelope.data });
    expect(result.restaurants).toHaveLength(2);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(DEFAULT_RADIUS_M > 0 ? 20 : 20);
    expect(result.meta.externalDataUnavailable).toBe(false);
  });

  it('loại bỏ item rỗng và envelope null', () => {
    const result = restaurantMapper.toDiscoveryModel({
      success: true,
      data: [{ id: 'keep' }, { id: '' }, null],
      meta: null,
    });
    expect(result.restaurants.map((r) => r.id)).toEqual(['keep']);
    expect(restaurantMapper.toDiscoveryModel(null).restaurants).toEqual([]);
  });

  it('sinh notice UNAVAILABLE khi provider không phản hồi', () => {
    const result = restaurantMapper.toDiscoveryModel({
      ...baseEnvelope,
      meta: { page: 1, limit: 20, total: 2, externalDataUnavailable: true, provider: 'google' },
    });
    const notice = result.notices.find((n) => n.kind === 'UNAVAILABLE');
    expect(notice).toBeDefined();
    expect(notice?.tone).toBe('warning');
    expect(notice?.message).toContain('cộng đồng');
  });

  it('sinh notice TRUNCATED kèm số giới hạn của nhà cung cấp', () => {
    const result = restaurantMapper.toDiscoveryModel({
      ...baseEnvelope,
      meta: { page: 1, limit: 20, total: 2, resultsTruncated: true, providerResultLimit: 200 },
    });
    const notice = result.notices.find((n) => n.kind === 'TRUNCATED');
    expect(notice).toBeDefined();
    expect(notice?.message).toContain('200');
  });

  it('sinh notice ATTRIBUTION nêu đích danh nhà cung cấp', () => {
    const result = restaurantMapper.toDiscoveryModel({
      success: true,
      data: [
        { id: 'r1', source: 'INTERNAL' },
        { id: 'r2', source: 'GOOGLE', attribution: 'Google Maps' },
      ],
      meta: { page: 1, limit: 20, total: 2, provider: 'google' },
    });
    const notice = result.notices.find((n) => n.kind === 'ATTRIBUTION');
    expect(notice).toBeDefined();
    expect(notice?.tone).toBe('info');
    expect(notice?.message).toContain('Google Maps');
  });

  it('sinh notice PRIVACY khi backend xác nhận không lưu vị trí', () => {
    const result = restaurantMapper.toDiscoveryModel({
      success: true,
      data: [{ id: 'r1', source: 'INTERNAL' }],
      meta: { page: 1, limit: 20, total: 1, provider: 'fake', locationStored: false },
    });
    const notice = result.notices.find((n) => n.kind === 'PRIVACY');
    expect(notice).toBeDefined();
    expect(notice?.message).toContain('không được lưu giữ');
  });

  it('sinh notice STALE khi có quán quá 30 ngày chưa cập nhật', () => {
    const result = restaurantMapper.toDiscoveryModel({
      success: true,
      data: [
        { id: 'fresh' },
        { id: 'old', fetchedAt: '2020-01-01T00:00:00.000Z' },
        { id: 'older', fetchedAt: '2019-06-01T00:00:00.000Z' },
      ],
      meta: { page: 1, limit: 20, total: 3 },
    });
    const notice = result.notices.find((n) => n.kind === 'STALE');
    expect(notice).toBeDefined();
    expect(notice?.tone).toBe('info');
    expect(notice?.message).toContain('2');
  });

  it('chỉ sinh notice PRIVACY khi không có cảnh báo nào khác', () => {
    const result = restaurantMapper.toDiscoveryModel({
      success: true,
      data: [{ id: 'r1', source: 'INTERNAL' }],
      meta: { page: 1, limit: 20, total: 1, provider: 'fake' },
    });
    // Backend luôn trả `locationStored: false` nên cam kết riêng tư luôn hiện (SC-007).
    // Không có cảnh báo nào khác vì dữ liệu không suy giảm, không bị cắt và toàn quán nội bộ.
    expect(result.notices.map((n) => n.kind)).toEqual(['PRIVACY']);
  });

  it('giữ nguyên thứ tự backend trả về — không tự sắp xếp lại', () => {
    const result = restaurantMapper.toDiscoveryModel({
      success: true,
      data: [
        { id: 'low', rating: 3 },
        { id: 'high', rating: 5 },
        { id: 'null-rating', rating: null },
      ],
      meta: { page: 1, limit: 20, total: 3 },
    });
    expect(result.restaurants.map((r) => r.id)).toEqual(['low', 'high', 'null-rating']);
  });
});

describe('RestaurantMapper.toDiscoveryParams', () => {
  it('mode NEARBY gửi lat/lng + radiusMeters, KHÔNG gửi q', () => {
    const params = restaurantMapper.toDiscoveryParams(
      baseState({ mode: 'NEARBY', lat: 10.776, lng: 106.7, radiusM: 3000 })
    );
    expect(params).toEqual({ radiusMeters: 3000, lat: 10.776, lng: 106.7 });
  });

  it('mode BOUNDS gửi đủ bốn mốc, không gửi lat/lng', () => {
    const params = restaurantMapper.toDiscoveryParams(
      baseState({
        mode: 'BOUNDS',
        bounds: { north: 10.8, south: 10.7, east: 106.8, west: 106.7 },
      })
    );
    expect(params).toEqual({
      radiusMeters: 5000,
      north: 10.8,
      south: 10.7,
      east: 106.8,
      west: 106.7,
    });
  });

  it('mode BOUNDS bỏ qua bounds không dùng được', () => {
    const params = restaurantMapper.toDiscoveryParams(
      baseState({ mode: 'BOUNDS', bounds: { north: 10.7, south: 10.8, east: 106.8, west: 106.7 } })
    );
    expect(params).not.toHaveProperty('north');
  });

  it('mode KEYWORD gửi q và KHÔNG gửi tham số vị trí', () => {
    const params = restaurantMapper.toDiscoveryParams(
      baseState({ mode: 'KEYWORD', query: ' phở chay ', lat: 10.776, lng: 106.7 })
    );
    expect(params.q).toBe('phở chay');
    expect(params).not.toHaveProperty('lat');
    expect(params).not.toHaveProperty('lng');
  });

  it('clamp radiusMeters về [100, 50000]', () => {
    expect(
      restaurantMapper.toDiscoveryParams(baseState({ mode: 'NEARBY', lat: 1, lng: 2, radiusM: 50 }))
        .radiusMeters
    ).toBe(MIN_RADIUS_M);
    expect(
      restaurantMapper.toDiscoveryParams(
        baseState({ mode: 'NEARBY', lat: 1, lng: 2, radiusM: 999999 })
      ).radiusMeters
    ).toBe(MAX_RADIUS_M);
  });

  it('dietPattern chỉ nhận VEGAN hoặc LACTO_OVO', () => {
    expect(
      restaurantMapper.toDiscoveryParams(
        baseState({ mode: 'NEARBY', lat: 1, lng: 2, dietPattern: DietPattern.VEGAN })
      ).dietPattern
    ).toBe('VEGAN');
    expect(
      restaurantMapper.toDiscoveryParams(
        baseState({ mode: 'NEARBY', lat: 1, lng: 2, dietPattern: DietPattern.LACTO_OVO })
      ).dietPattern
    ).toBe('LACTO_OVO');
  });

  it('chỉ gửi 6 tham số lọc nâng cao ở mode KEYWORD', () => {
    const advanced = {
      minPrice: 1,
      maxPrice: 3,
      minRating: 4,
      openState: 'now' as const,
      openOnDay: 'sat' as const,
      openAtHour: 19,
    };

    const keyword = restaurantMapper.toDiscoveryParams(
      baseState({ mode: 'KEYWORD', query: 'chay', advanced })
    );
    expect(keyword.minPrice).toBe(1);
    expect(keyword.maxPrice).toBe(3);
    expect(keyword.minRating).toBe(4);
    expect(keyword.openState).toBe('now');
    expect(keyword.openOnDay).toBe('sat');
    expect(keyword.openAtHour).toBe(19);

    const nearby = restaurantMapper.toDiscoveryParams(
      baseState({ mode: 'NEARBY', lat: 1, lng: 2, advanced })
    );
    expect(nearby).not.toHaveProperty('minPrice');
    expect(nearby).not.toHaveProperty('minRating');
    expect(nearby).not.toHaveProperty('openAtHour');
  });

  it('gửi locationSource và locationConsent khi có', () => {
    const params = restaurantMapper.toDiscoveryParams(
      baseState({
        mode: 'NEARBY',
        lat: 1,
        lng: 2,
        locationSource: 'DEVICE',
        locationConsent: true,
      })
    );
    expect(params.locationSource).toBe('DEVICE');
    expect(params.locationConsent).toBe('true');

    const manual = restaurantMapper.toDiscoveryParams(
      baseState({ mode: 'NEARBY', lat: 1, lng: 2, locationSource: 'MANUAL' })
    );
    expect(manual.locationSource).toBe('MANUAL');
    expect(manual).not.toHaveProperty('locationConsent');
  });

  it('không gửi page/limit — discovery trả toàn bộ tập đã dedupe', () => {
    const params = restaurantMapper.toDiscoveryParams(
      baseState({ mode: 'NEARBY', lat: 1, lng: 2 })
    );
    expect(params).not.toHaveProperty('page');
    expect(params).not.toHaveProperty('limit');
  });

  it('bỏ qua lat/lng không phải số', () => {
    const params = restaurantMapper.toDiscoveryParams(
      baseState({ mode: 'NEARBY', lat: NaN, lng: 106.7 })
    );
    expect(params).not.toHaveProperty('lat');
    expect(params).not.toHaveProperty('lng');
  });
});

describe('RestaurantMapper.toGeocodeResult (FR-033 — không bịa dữ liệu)', () => {
  it('data null → isAvailable false và tọa độ null, KHÔNG thay bằng tọa độ mặc định', () => {
    const result = restaurantMapper.toGeocodeResult({
      success: true,
      data: null,
      externalDataUnavailable: true,
    });
    expect(result.isAvailable).toBe(false);
    expect(result.lat).toBeNull();
    expect(result.lng).toBeNull();
  });

  it('envelope null hoặc data thiếu → isAvailable false', () => {
    expect(restaurantMapper.toGeocodeResult(null).isAvailable).toBe(false);
    expect(restaurantMapper.toGeocodeResult({ success: true }).isAvailable).toBe(false);
  });

  it('data hợp lệ → isAvailable true, nhãn lấy từ address', () => {
    const result = restaurantMapper.toGeocodeResult({
      success: true,
      data: {
        address: 'Hồ Gươm, Hà Nội',
        latitude: 21.0285,
        longitude: 105.8542,
        placeId: 'fake:abc',
        attribution: 'Dữ liệu minh hoạ',
      },
    });
    expect(result.isAvailable).toBe(true);
    expect(result.lat).toBeCloseTo(21.0285);
    expect(result.lng).toBeCloseTo(105.8542);
    expect(result.label).toBe('Hồ Gươm, Hà Nội');
    expect(result.placeId).toBe('fake:abc');
  });

  it('hỗ trợ alias lat/lng và label', () => {
    const result = restaurantMapper.toGeocodeResult({
      success: true,
      data: { lat: 10.776, lng: 106.7, label: 'Bến Thành' },
    });
    expect(result.lat).toBeCloseTo(10.776);
    expect(result.label).toBe('Bến Thành');
  });

  it('data có mặt nhưng tọa độ không đọc được → isAvailable false', () => {
    const result = restaurantMapper.toGeocodeResult({
      success: true,
      data: { address: 'Không rõ', latitude: 'abc', longitude: null },
    });
    expect(result.isAvailable).toBe(false);
    expect(result.lat).toBeNull();
  });
});

describe('RestaurantMapper.toSubmitDto (payload đúng contract)', () => {
  it('đổi tên field sang latitude/longitude/dietTags', () => {
    const dto = restaurantMapper.toSubmitDto({
      name: 'Quán chay Mới',
      address: '123 Phố Huế, Hà Nội',
      latitude: 21.0285,
      longitude: 105.8542,
      dietTags: ['VEGAN'],
      categories: ['quán ăn'],
    });

    expect(dto.name).toBe('Quán chay Mới');
    expect(dto.address).toBe('123 Phố Huế, Hà Nội');
    expect(dto.latitude).toBeCloseTo(21.0285);
    expect(dto.longitude).toBeCloseTo(105.8542);
    expect(dto.dietTags).toEqual(['VEGAN']);
    expect(dto.categories).toEqual(['quán ăn']);
  });

  it('KHÔNG gửi field nào nằm ngoài schema backend', () => {
    const dto = restaurantMapper.toSubmitDto({
      name: 'Quán chay Mới',
      address: '123 Phố Huế, Hà Nội',
      latitude: 21.0285,
      longitude: 105.8542,
    });

    expect(dto).not.toHaveProperty('lat');
    expect(dto).not.toHaveProperty('lng');
    expect(dto).not.toHaveProperty('dietaryTags');
    expect(dto).not.toHaveProperty('dishes');
    expect(dto).not.toHaveProperty('openingHours');
    expect(dto).not.toHaveProperty('priceRange');
    expect(dto).not.toHaveProperty('phoneNumber');
    expect(dto).not.toHaveProperty('note');
  });

  it('loại dietTags không thuộc enum backend', () => {
    const dto = restaurantMapper.toSubmitDto({
      name: 'Quán chay Mới',
      address: '123 Phố Huế, Hà Nội',
      latitude: 1,
      longitude: 2,
      dietTags: ['VEGAN', 'LACTO_OVO', 'BUDDHIST', 'CHRISTIAN', 'LACTO_VEGETARIAN', 'RẤT_VEGAN'],
    });
    expect(dto.dietTags).toEqual(['VEGAN', 'LACTO_OVO', 'BUDDHIST', 'CHRISTIAN']);
  });

  it('bỏ mảng rỗng thay vì gửi mảng không', () => {
    const dto = restaurantMapper.toSubmitDto({
      name: 'Quán chay Mới',
      address: '123 Phố Huế, Hà Nội',
      latitude: 1,
      longitude: 2,
      categories: [],
      dietTags: [],
      allergenFreeCodes: [],
      excludedIngredients: [],
    });
    expect(dto).not.toHaveProperty('categories');
    expect(dto).not.toHaveProperty('dietTags');
    expect(dto).not.toHaveProperty('allergenFreeCodes');
    expect(dto).not.toHaveProperty('excludedIngredients');
  });
});

describe('RestaurantMapper — tương thích màn hình quản trị (ngoài phạm vi redesign)', () => {
  it('toSingleModel map chi tiết quán', () => {
    const item = restaurantMapper.toSingleModel({
      success: true,
      data: { id: 'r', latitude: 10.8, longitude: 106.7 },
    });
    expect(item.id).toBe('r');
    expect(item.lat).toBeCloseTo(10.8);
  });

  it('toQueueModel lọc bản ghi không có id', () => {
    const queue = restaurantMapper.toQueueModel({
      success: true,
      data: [{ id: 'q1', status: 'PENDING' }, { id: '' }],
      meta: null,
    });
    expect(queue.items.map((i) => i.id)).toEqual(['q1']);
  });

  it('toReviewedModel giữ trạng thái sau khi duyệt', () => {
    const reviewed = restaurantMapper.toReviewedModel({
      success: true,
      data: { id: 'q1', status: 'PUBLISHED' },
    });
    expect(reviewed.status).toBe(RestaurantStatus.PUBLISHED);
  });

  it('toReviewDto giữ nguyên shape của luồng quản trị', () => {
    const reviewDto = restaurantMapper.toReviewDto('REJECT', 'Quán không phục vụ đồ chay');
    expect(reviewDto.decision).toBe('REJECT');
    expect(reviewDto.reason).toBe('Quán không phục vụ đồ chay');
  });
});

describe('formatDistance', () => {
  it('m / km / null / âm / NaN', () => {
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(999)).toBe('999 m');
    expect(formatDistance(1000)).toBe('1,0 km');
    expect(formatDistance(1500)).toBe('1,5 km');
    expect(formatDistance(null)).toBe('');
    expect(formatDistance(-5)).toBe('');
    expect(formatDistance(NaN)).toBe('');
  });
});
