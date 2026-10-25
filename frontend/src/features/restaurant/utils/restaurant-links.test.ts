import { describe, expect, it } from 'vitest';
import {
  getExternalHttpUrl,
  getRestaurantDirectionsUrl,
  getRestaurantPhoneUrl,
} from './restaurant-links';

describe('restaurant action links', () => {
  it.each([
    'javascript:alert(1)',
    'data:text/html,hello',
    'https://user:secret@example.com',
    '/relative',
    '',
  ])('rejects unsafe or non-public provider URL %s', (url) =>
    expect(getExternalHttpUrl(url)).toBeNull()
  );
  it('accepts normal provider websites', () => {
    expect(getExternalHttpUrl('https://example.com/menu')).toBe('https://example.com/menu');
  });
  it('builds directions for zero-valued coordinates instead of discarding them', () => {
    const url = new URL(getRestaurantDirectionsUrl({ lat: 0, lng: 0, name: 'Quán', address: '' }));
    expect(url.searchParams.get('destination')).toBe('0,0');
  });
  it('falls back to the actual name/address when coordinates are missing or invalid', () => {
    const url = new URL(
      getRestaurantDirectionsUrl({
        lat: 91,
        lng: 181,
        name: 'Quán chay',
        address: '1 Nguyễn Huệ',
      })
    );
    expect(url.searchParams.get('destination')).toBe('Quán chay, 1 Nguyễn Huệ');
  });
  it('normalizes a provider phone number and rejects non-phone input', () => {
    expect(getRestaurantPhoneUrl('+84 (28) 1234-5678')).toBe('tel:+842812345678');
    expect(getRestaurantPhoneUrl('javascript:alert(1)')).toBeNull();
    expect(getRestaurantPhoneUrl(null)).toBeNull();
  });
});
