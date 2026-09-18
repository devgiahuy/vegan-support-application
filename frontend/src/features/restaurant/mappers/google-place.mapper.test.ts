import { describe, expect, it } from 'vitest';
import { googlePlaceMapper } from './google-place.mapper';
import type { GooglePlaceDto } from '../types/restaurant.dto';
import { PlaceDietType, PlaceOpeningStatus } from '@/common/enums';

const fullGoogle: GooglePlaceDto = {
  id: 'places/ChIJ123',
  displayName: 'Cơm Chay Bồ Đề',
  formattedAddress: '45 Nguyễn Huệ, Quận 1, TP.HCM',
  latitude: 10.775,
  longitude: 106.701,
  rating: 4.6,
  userRatingCount: 128,
  photos: [
    { url: 'https://lh3.googleusercontent.com/p/photo1', attribution: 'Nguyễn Văn A' },
    null,
  ],
  openingHours: ['Thứ Hai: 8:00 – 21:00', 'Thứ Ba: 8:00 – 21:00'],
  openNow: true,
  googleMapsUri: 'https://maps.google.com/?cid=123',
  types: ['vegetarian_restaurant', 'restaurant'],
};

describe('GooglePlaceMapper full', () => {
  it('map đủ field Google → Place', () => {
    const place = googlePlaceMapper.toModel(fullGoogle);
    expect(place.providerId).toBe('places/ChIJ123');
    expect(place.id).toBe('places/ChIJ123');
    expect(place.name).toBe('Cơm Chay Bồ Đề');
    expect(place.lat).toBe(10.775);
    expect(place.lng).toBe(106.701);
    expect(place.rating).toBe(4.6);
    expect(place.reviewCount).toBe(128);
    expect(place.openingStatus).toBe(PlaceOpeningStatus.OPEN);
    expect(place.googleMapsUri).toBe('https://maps.google.com/?cid=123');
    expect(place.source).toBe('GOOGLE');
    expect(place.sourceLabel).toBe('Google');
  });

  it('giữ attribution ảnh, bỏ ảnh null', () => {
    const place = googlePlaceMapper.toModel(fullGoogle);
    expect(place.photos).toHaveLength(1);
    expect(place.photos[0]).toEqual({
      url: 'https://lh3.googleusercontent.com/p/photo1',
      attribution: 'Nguyễn Văn A',
    });
  });

  it('thiếu field → null an toàn, không đoán mở cửa', () => {
    const place = googlePlaceMapper.toModel({ id: 'places/xyz' });
    expect(place.name).toBe('Quán chay');
    expect(place.lat).toBeNull();
    expect(place.rating).toBeNull();
    expect(place.reviewCount).toBeNull();
    expect(place.photos).toEqual([]);
    expect(place.openingStatus).toBe(PlaceOpeningStatus.UNKNOWN);
    expect(place.openingStatusLabel).toBe('Chưa rõ giờ mở cửa');
    expect(place.googleMapsUri).toBeNull();
  });

  it('rating ngoài 0–5 và reviewCount âm → null', () => {
    const place = googlePlaceMapper.toModel({ id: 'x', rating: 9, userRatingCount: -3 });
    expect(place.rating).toBeNull();
    expect(place.reviewCount).toBeNull();
  });

  it('tọa độ chuỗi số parse được, chuỗi rác → null', () => {
    const ok = googlePlaceMapper.toModel({ id: 'x', latitude: '10.7', longitude: '106.6' });
    expect(ok.lat).toBeCloseTo(10.7);
    const bad = googlePlaceMapper.toModel({ id: 'y', latitude: 'abc', longitude: '' });
    expect(bad.lat).toBeNull();
    expect(bad.lng).toBeNull();
  });

  it('null/undefined → Place rỗng an toàn', () => {
    const place = googlePlaceMapper.toModel(null);
    expect(place.id).toBe('');
    expect(place.photos).toEqual([]);
  });
});

describe('GooglePlaceMapper diet heuristic (FR-007, SC-005)', () => {
  it.each([
    ['Quán Vegan Sài Gòn', ['restaurant'], PlaceDietType.VEGAN_FRIENDLY],
    ['Cơm chay từ thiện', ['meal_takeaway'], PlaceDietType.VEGETARIAN],
    ['Nhà hàng mặn', ['restaurant'], PlaceDietType.UNKNOWN],
  ])('"%s" → %s', (displayName, types, expected) => {
    const place = googlePlaceMapper.toModel({ id: 'x', displayName, types });
    expect(place.dietType).toBe(expected);
  });

  it('mọi suy đoán đều gắn nhãn hạn định "Có thể..."', () => {
    const names = ['Cơm chay A', 'Vegan B', 'Chay C', 'Bún bò Huế'];
    for (const displayName of names) {
      const place = googlePlaceMapper.toModel({ id: 'x', displayName });
      expect(place.dietLabel).toMatch(/^Có thể phù hợp/);
    }
  });
});
