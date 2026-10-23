import type { Restaurant } from '../types/restaurant.model';

/**
 * Nguồn dữ liệu được phép vẽ ghim lên bản đồ MapLibre: quán nội bộ đã được VeggieConnect duyệt (và dữ liệu demo khi dev).
 * Quán lấy từ nhà cung cấp bản đồ bên ngoài (Google/SerpApi) chỉ hiện ở danh sách vì điều khoản của họ không cho
 * hiển thị nội dung đó trên bản đồ của bên khác.
 */
const PINNABLE_SOURCES = new Set(['INTERNAL', 'FAKE']);

export interface MapPin {
  id: string;
  /** Số thứ tự trong danh sách đầy đủ (bắt đầu từ 1) để ghim khớp số trên thẻ quán. */
  label: number;
  lat: number;
  lng: number;
}

export function canPinOnMap(restaurant: Pick<Restaurant, 'source' | 'lat' | 'lng'>): boolean {
  return PINNABLE_SOURCES.has(restaurant.source) && restaurant.lat !== null && restaurant.lng !== null;
}

export function buildMapPins(items: Restaurant[]): MapPin[] {
  const pins: MapPin[] = [];
  items.forEach((item, index) => {
    if (item.lat === null || item.lng === null || !canPinOnMap(item)) return;
    pins.push({ id: item.id, label: index + 1, lat: item.lat, lng: item.lng });
  });
  return pins;
}

/** Mức zoom vừa khít bán kính tìm kiếm trên một khung rộng khoảng 340dp (Web Mercator). */
export function zoomForRadius(radiusM: number, lat: number, viewWidthDp = 340): number {
  const metersPerPixelAtZoomZero = 156543.03392 * Math.cos((lat * Math.PI) / 180);
  const zoom = Math.log2((metersPerPixelAtZoomZero * viewWidthDp) / (2 * Math.max(radiusM, 100)));
  return Math.min(17, Math.max(8, Math.round(zoom * 10) / 10));
}

/** Khoảng cách xấp xỉ giữa hai điểm (mét, công thức haversine). */
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = Math.PI / 180;
  const dLat = (bLat - aLat) * toRad;
  const dLng = (bLng - aLng) * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * toRad) * Math.cos(bLat * toRad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
