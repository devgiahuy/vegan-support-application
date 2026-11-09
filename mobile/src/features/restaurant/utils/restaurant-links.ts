import type { Href } from 'expo-router';

import { buildDirectionsUrl } from '@/lib/env';
import type { Restaurant } from '../types/restaurant.model';

/** Đường dẫn chi tiết quán; id nhà cung cấp có dấu `:` nên phải mã hóa. */
export function restaurantHref(id: string): Href {
  return `/restaurants/${encodeURIComponent(id)}` as Href;
}

/** Chỉ cho phép liên kết http(s) từ dữ liệu nhà cung cấp; trả `null` với giá trị khác. */
export function getExternalHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Liên kết chỉ đường: ưu tiên `mapsUrl` của nhà cung cấp, không có thì dùng mẫu chỉ đường theo tọa độ. */
export function getRestaurantDirectionsUrl(restaurant: Pick<Restaurant, 'mapsUrl' | 'lat' | 'lng'>): string {
  const provided = getExternalHttpUrl(restaurant.mapsUrl);
  if (provided) return provided;
  return restaurant.lat !== null && restaurant.lng !== null ? buildDirectionsUrl(restaurant.lat, restaurant.lng) : '';
}
