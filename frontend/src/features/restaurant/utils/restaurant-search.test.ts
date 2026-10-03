import { describe, expect, it } from 'vitest';
import { DietPattern } from '@/common/enums';
import { DEFAULT_RADIUS_M } from '../schemas/restaurant.schema';
import {
  MIN_KEYWORD_LENGTH,
  countActiveAdvancedFilters,
  emptyStateCopy,
  resolveSearchMode,
  sanitizeAdvancedFilters,
  sanitizePersistedFilters,
} from './restaurant-search';

describe('resolveSearchMode', () => {
  it('trả null khi state rỗng hoặc null', () => {
    expect(resolveSearchMode(null)).toBeNull();
    expect(resolveSearchMode({})).toBeNull();
  });

  it('từ khóa 1 ký tự chưa kích hoạt KEYWORD — không gửi truy vấn search (SC-003)', () => {
    expect(MIN_KEYWORD_LENGTH).toBe(2);
    expect(resolveSearchMode({ lat: 10.8, lng: 106.7, query: 'a' })).toBe('NEARBY');
  });

  it('từ khóa đủ 2 ký tự kích hoạt KEYWORD, kể cả khi có bounds', () => {
    expect(resolveSearchMode({ lat: 10.8, lng: 106.7, query: 'chay' })).toBe('KEYWORD');
    expect(
      resolveSearchMode({
        bounds: { north: 10.8, south: 10.7, east: 106.8, west: 106.7 },
        query: 'phở',
      })
    ).toBe('KEYWORD');
  });

  it('chỉ tính ký tự sau khi trim', () => {
    expect(resolveSearchMode({ lat: 10.8, lng: 106.7, query: ' a ' })).toBe('NEARBY');
    expect(resolveSearchMode({ lat: 10.8, lng: 106.7, query: ' a b ' })).toBe('KEYWORD');
  });

  it('bounds đủ 4 mốc hợp lệ và không từ khóa thì chọn BOUNDS', () => {
    expect(
      resolveSearchMode({ bounds: { north: 10.8, south: 10.7, east: 106.8, west: 106.7 } })
    ).toBe('BOUNDS');
  });

  it('bounds thiếu một mốc thì không chọn BOUNDS', () => {
    expect(
      resolveSearchMode({ bounds: { north: 10.8, south: 10.7, east: 106.8 } as never })
    ).toBeNull();
  });

  it('bounds sai thứ tự thì không chọn BOUNDS', () => {
    expect(
      resolveSearchMode({ bounds: { north: 10.7, south: 10.8, east: 106.8, west: 106.7 } })
    ).toBeNull();
    expect(
      resolveSearchMode({ bounds: { north: 10.8, south: 10.7, east: 106.7, west: 106.8 } })
    ).toBeNull();
  });

  it('có đủ cặp lat/lng thì chọn NEARBY', () => {
    expect(resolveSearchMode({ lat: 10.8, lng: 106.7 })).toBe('NEARBY');
    expect(resolveSearchMode({ lat: 0, lng: 0 })).toBe('NEARBY');
  });

  it('chỉ có lat hoặc chỉ có lng thì trả null — backend yêu cầu đi cùng nhau', () => {
    expect(resolveSearchMode({ lat: 10.8 })).toBeNull();
    expect(resolveSearchMode({ lng: 106.7 })).toBeNull();
  });

  it('lat hoặc lng là NaN thì coi như không hợp lệ', () => {
    expect(resolveSearchMode({ lat: NaN, lng: 106.7 })).toBeNull();
  });
});

describe('countActiveAdvancedFilters', () => {
  it('trả 0 khi không có bộ lọc nào', () => {
    expect(countActiveAdvancedFilters({})).toBe(0);
    expect(countActiveAdvancedFilters(null)).toBe(0);
  });

  it('đếm chính xác số bộ lọc đang bật, tối đa 6', () => {
    expect(countActiveAdvancedFilters({ minPrice: 1 })).toBe(1);
    expect(countActiveAdvancedFilters({ minPrice: 1, maxPrice: 3 })).toBe(2);
    expect(
      countActiveAdvancedFilters({
        minPrice: 1,
        maxPrice: 3,
        minRating: 4,
        openState: 'now',
        openOnDay: 'sat',
        openAtHour: 19,
      })
    ).toBe(6);
  });

  it('coi undefined là không bật', () => {
    expect(countActiveAdvancedFilters({ minPrice: undefined, maxPrice: 2 })).toBe(1);
  });
});

describe('sanitizePersistedFilters', () => {
  it('trả bộ lọc mặc định khi dữ liệu rác', () => {
    expect(sanitizePersistedFilters(null)).toEqual({
      radiusM: DEFAULT_RADIUS_M,
      query: '',
      dietPattern: undefined,
      advanced: {},
    });
    expect(sanitizePersistedFilters('abc')).toEqual({
      radiusM: DEFAULT_RADIUS_M,
      query: '',
      dietPattern: undefined,
      advanced: {},
    });
    expect(sanitizePersistedFilters([1, 2, 3])).toEqual({
      radiusM: DEFAULT_RADIUS_M,
      query: '',
      dietPattern: undefined,
      advanced: {},
    });
  });

  it('LOẠI BỎ mọi dữ liệu vị trí — ranh giới riêng tư FR-029', () => {
    const result = sanitizePersistedFilters({
      lat: 10.8231,
      lng: 106.6297,
      bounds: { north: 10.9, south: 10.7, east: 106.9, west: 106.5 },
      addressText: 'Hồ Gươm, Hà Nội',
      placeLabel: 'Hồ Gươm, Hà Nội',
      locationSource: 'DEVICE',
      locationConsent: true,
      radiusM: 15000,
      query: 'phở chay',
    });

    expect(result).not.toHaveProperty('lat');
    expect(result).not.toHaveProperty('lng');
    expect(result).not.toHaveProperty('bounds');
    expect(result).not.toHaveProperty('addressText');
    expect(result).not.toHaveProperty('placeLabel');
    expect(result).not.toHaveProperty('locationSource');
    expect(result).not.toHaveProperty('locationConsent');

    expect(JSON.stringify(result)).not.toContain('10.8231');
    expect(JSON.stringify(result)).not.toContain('Hồ Gươm');

    expect(result.radiusM).toBe(15000);
    expect(result.query).toBe('phở chay');
  });

  it('giữ nguyên bộ lọc hợp lệ', () => {
    const result = sanitizePersistedFilters({
      radiusM: 3000,
      query: 'bún riêu',
      dietPattern: DietPattern.VEGAN,
      advanced: {
        minPrice: 1,
        maxPrice: 3,
        minRating: 4,
        openState: 'now',
        openOnDay: 'sun',
        openAtHour: 19,
      },
    });
    expect(result.radiusM).toBe(3000);
    expect(result.query).toBe('bún riêu');
    expect(result.dietPattern).toBe(DietPattern.VEGAN);
    expect(result.advanced).toEqual({
      minPrice: 1,
      maxPrice: 3,
      minRating: 4,
      openState: 'now',
      openOnDay: 'sun',
      openAtHour: 19,
    });
  });

  it('loại bỏ dietPattern không hợp lệ — backend chỉ nhận VEGAN và LACTO_OVO', () => {
    expect(
      sanitizePersistedFilters({ dietPattern: 'LACTO_VEGETARIAN' }).dietPattern
    ).toBeUndefined();
    expect(sanitizePersistedFilters({ dietPattern: 'OVO_VEGETARIAN' }).dietPattern).toBeUndefined();
    expect(sanitizePersistedFilters({ dietPattern: DietPattern.LACTO_OVO }).dietPattern).toBe(
      DietPattern.LACTO_OVO
    );
    expect(sanitizePersistedFilters({ dietPattern: DietPattern.VEGAN }).dietPattern).toBe(
      DietPattern.VEGAN
    );
  });

  it('cắt từ khóa quá 160 ký tự theo giới hạn contract', () => {
    const result = sanitizePersistedFilters({ query: 'a'.repeat(300) });
    expect(result.query.length).toBe(160);
  });

  it('fallback về bán kính mặc định khi radiusM không phải số hữu hạn', () => {
    expect(sanitizePersistedFilters({ radiusM: 'x' }).radiusM).toBe(DEFAULT_RADIUS_M);
    expect(sanitizePersistedFilters({ radiusM: NaN }).radiusM).toBe(DEFAULT_RADIUS_M);
  });
});

describe('sanitizeAdvancedFilters', () => {
  it('loại bỏ giá trị ngoài ràng buộc contract', () => {
    expect(sanitizeAdvancedFilters({ minPrice: 5 }).minPrice).toBeUndefined();
    expect(sanitizeAdvancedFilters({ minPrice: -1 }).minPrice).toBeUndefined();
    expect(sanitizeAdvancedFilters({ minRating: 1.5 }).minRating).toBeUndefined();
    expect(sanitizeAdvancedFilters({ minRating: 5 }).minRating).toBeUndefined();
    expect(sanitizeAdvancedFilters({ openState: 'closed' }).openState).toBeUndefined();
    expect(sanitizeAdvancedFilters({ openOnDay: 'monday' }).openOnDay).toBeUndefined();
    expect(sanitizeAdvancedFilters({ openAtHour: 24 }).openAtHour).toBeUndefined();
    expect(sanitizeAdvancedFilters({ openAtHour: -1 }).openAtHour).toBeUndefined();
  });

  it('giữ các giá trị trong ràng buộc', () => {
    expect(sanitizeAdvancedFilters({ minPrice: 0 }).minPrice).toBe(0);
    expect(sanitizeAdvancedFilters({ maxPrice: 4 }).maxPrice).toBe(4);
    expect(sanitizeAdvancedFilters({ minRating: 2 }).minRating).toBe(2);
    expect(sanitizeAdvancedFilters({ minRating: 4.5 }).minRating).toBe(4.5);
    expect(sanitizeAdvancedFilters({ openState: '24h' }).openState).toBe('24h');
    expect(sanitizeAdvancedFilters({ openOnDay: 'mon' }).openOnDay).toBe('mon');
    expect(sanitizeAdvancedFilters({ openAtHour: 0 }).openAtHour).toBe(0);
    expect(sanitizeAdvancedFilters({ openAtHour: 23 }).openAtHour).toBe(23);
  });

  it('trả về rỗng khi dữ liệu không phải object', () => {
    expect(sanitizeAdvancedFilters(null)).toEqual({});
    expect(sanitizeAdvancedFilters('x')).toEqual({});
  });
});

describe('emptyStateCopy', () => {
  it('trả nhãn tiếng Việt khác nhau theo chế độ', () => {
    const nearby = emptyStateCopy('NEARBY');
    const bounds = emptyStateCopy('BOUNDS');
    const keyword = emptyStateCopy('KEYWORD');

    expect(new Set([nearby.title, bounds.title, keyword.title]).size).toBe(3);
    expect(nearby.actions.length).toBeGreaterThan(0);
    expect(bounds.actions.length).toBeGreaterThan(0);
    expect(keyword.actions.length).toBeGreaterThan(0);
  });

  it('gợi ý nới bán kính khi tìm lân cận', () => {
    expect(emptyStateCopy('NEARBY').actions).toContain('Nới bán kính');
  });

  it('gợi ý xoá từ khóa khi tìm theo từ khóa', () => {
    expect(emptyStateCopy('KEYWORD').actions).toContain('Xoá từ khóa');
  });

  it('mọi chế độ đều cho phép đổi vị trí khi không có kết quả', () => {
    expect(emptyStateCopy('NEARBY').actions).toContain('Đổi vị trí');
    expect(emptyStateCopy('BOUNDS').actions).toContain('Đổi vị trí');
    expect(emptyStateCopy('KEYWORD').actions).toContain('Đổi vị trí');
  });

  it('xử lý mode null mà không lỗi', () => {
    expect(emptyStateCopy(null).title.length).toBeGreaterThan(0);
  });
});
