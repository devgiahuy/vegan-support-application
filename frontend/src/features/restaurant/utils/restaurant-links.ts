import type { Restaurant } from '../types/restaurant.model';

/** Provider URLs are untrusted; only ordinary web links may be rendered. */
export function getExternalHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function getRestaurantPhoneUrl(value: string | null): string | null {
  if (!value || !/^\+?[\d\s().-]{5,30}$/.test(value.trim())) return null;
  const number = value.replace(/[^\d+]/g, '');
  return /^\+?\d{5,16}$/.test(number) ? `tel:${number}` : null;
}

export function getRestaurantDirectionsUrl(
  restaurant: Pick<Restaurant, 'lat' | 'lng' | 'name' | 'address'>
): string {
  const { lat, lng, name, address } = restaurant;
  const hasCoordinates =
    lat !== null &&
    lng !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;
  const destination = hasCoordinates ? `${lat},${lng}` : [name, address].filter(Boolean).join(', ');
  const params = new URLSearchParams({ api: '1', destination });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
