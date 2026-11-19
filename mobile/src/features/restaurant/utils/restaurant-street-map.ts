import type { Restaurant, RestaurantBounds } from '../types/restaurant.model';

/**
 * Logic thuần cho bản đồ đường phố (MapLibre) — đồng bộ `frontend/.../restaurant-map-data.ts` của web.
 * KHÔNG import React / react-native để có thể chạy trong môi trường node (`npm test`).
 */

/** `[kinh độ, vĩ độ]` theo chuẩn GeoJSON/MapLibre. */
export type LngLatTuple = [longitude: number, latitude: number];
/** `[tây, nam, đông, bắc]` theo thư viện MapLibre React Native. */
export type LngLatBoundsTuple = [west: number, south: number, east: number, north: number];

export interface RestaurantPointProperties {
  id: string;
  name: string;
  /** Số thứ tự hiển thị trên ghim, trùng thứ tự thẻ trong danh sách. */
  position: number;
}

export interface RestaurantPointFeature {
  type: 'Feature';
  id: string;
  geometry: { type: 'Point'; coordinates: LngLatTuple };
  properties: RestaurantPointProperties;
}

export interface RestaurantPointCollection {
  type: 'FeatureCollection';
  features: RestaurantPointFeature[];
}

const EARTH_RADIUS_M = 6_371_000;
/** Giới hạn phép chiếu Web Mercator; ngoài khoảng này tọa độ không vẽ được. */
const MAX_MERCATOR_LAT = 85.051129;

/** Mức phóng lớn nhất mà cụm ghim còn tách được; vượt mức này chỉ có thể mở danh sách cụm. */
export const CLUSTER_MAX_ZOOM = 19;
export const MAP_MIN_ZOOM = 2;
export const MAP_MAX_ZOOM = 20;

function isDrawable(lat: number | null, lng: number | null): lat is number {
  return (
    lat !== null &&
    lng !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= MAX_MERCATOR_LAT &&
    Math.abs(lng) <= 180
  );
}

/** Quán có tọa độ hợp lệ thành điểm GeoJSON; quán thiếu/sai tọa độ bị bỏ qua nhưng vẫn giữ số thứ tự theo danh sách. */
export function toRestaurantMapData(restaurants: Restaurant[]): RestaurantPointCollection {
  return {
    type: 'FeatureCollection',
    features: restaurants.flatMap((restaurant, index) => {
      const { lat, lng } = restaurant;
      if (!isDrawable(lat, lng) || lng === null) return [];
      return [
        {
          type: 'Feature' as const,
          id: restaurant.id,
          geometry: { type: 'Point' as const, coordinates: [lng, lat] as LngLatTuple },
          properties: { id: restaurant.id, name: restaurant.name, position: index + 1 },
        },
      ];
    }),
  };
}

/** Một quán đang được chọn → tập điểm cho lớp làm nổi bật (rỗng khi không chọn hoặc quán không có tọa độ). */
export function toSelectedMapData(restaurants: Restaurant[], selectedId: string | null): RestaurantPointCollection {
  if (!selectedId) return { type: 'FeatureCollection', features: [] };
  const all = toRestaurantMapData(restaurants);
  return { type: 'FeatureCollection', features: all.features.filter((feature) => feature.id === selectedId) };
}

export interface RadiusPolygon {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: { type: 'Polygon'; coordinates: LngLatTuple[][] };
}

/** Vùng tìm kiếm quanh tâm (chỉ là phạm vi tìm, không phải lộ trình hay khoảng cách đi lại). */
export function restaurantRadiusPolygon(center: { lat: number; lng: number }, radiusM: number): RadiusPolygon {
  const lat = (center.lat * Math.PI) / 180;
  const lng = (center.lng * Math.PI) / 180;
  const distance = Math.max(0, radiusM) / EARTH_RADIUS_M;
  const ring: LngLatTuple[] = Array.from({ length: 64 }, (_, index) => {
    const bearing = (index * 2 * Math.PI) / 64;
    const pointLat = Math.asin(Math.sin(lat) * Math.cos(distance) + Math.cos(lat) * Math.sin(distance) * Math.cos(bearing));
    const pointLng =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distance) * Math.cos(lat),
        Math.cos(distance) - Math.sin(lat) * Math.sin(pointLat)
      );
    return [(pointLng * 180) / Math.PI, (pointLat * 180) / Math.PI];
  });
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]!]] },
  };
}

/** Khung bao quanh vùng tìm kiếm để camera thu phóng vừa đủ. */
export function radiusFitBounds(center: { lat: number; lng: number }, radiusM: number): LngLatBoundsTuple {
  const ring = restaurantRadiusPolygon(center, radiusM).geometry.coordinates[0]!;
  const longitudes = ring.map((point) => point[0]);
  const latitudes = ring.map((point) => point[1]);
  return [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)];
}

/** Đổi khung MapLibre `[tây, nam, đông, bắc]` sang khung gửi backend; `null` nếu dữ liệu không hợp lệ. */
export function toRestaurantBounds(bounds: readonly number[] | null | undefined): RestaurantBounds | null {
  if (!bounds || bounds.length !== 4) return null;
  const [west, south, east, north] = bounds as [number, number, number, number];
  if (![west, south, east, north].every((value) => typeof value === 'number' && Number.isFinite(value))) return null;
  if (north <= south) return null;
  // Khung vắt qua kinh tuyến 180° (đông < tây) không phù hợp yêu cầu của backend (`east > west`).
  if (east <= west) return null;
  return { north, south, east, west };
}

export function areRestaurantBoundsEqual(a: RestaurantBounds | null, b: RestaurantBounds | null): boolean {
  if (!a || !b) return a === b;
  return a.north === b.north && a.south === b.south && a.east === b.east && a.west === b.west;
}

/** Giới hạn mức phóng vào khoảng cho phép của bản đồ. */
export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return MAP_MIN_ZOOM;
  return Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, zoom));
}

/** Cụm không thể tách thêm bằng cách phóng to → mở danh sách các quán trong cụm. */
export function shouldListCluster(expansionZoom: number): boolean {
  return !Number.isFinite(expansionZoom) || expansionZoom > CLUSTER_MAX_ZOOM;
}

/** Số quán nằm trong khung đang xem (bản đồ thật không ẩn quán, chỉ đếm để báo người dùng). */
export function countInBounds(restaurants: Restaurant[], bounds: RestaurantBounds | null): number {
  if (!bounds) return 0;
  return restaurants.filter(
    (restaurant) =>
      isDrawable(restaurant.lat, restaurant.lng) &&
      restaurant.lat !== null &&
      restaurant.lng !== null &&
      restaurant.lat <= bounds.north &&
      restaurant.lat >= bounds.south &&
      restaurant.lng <= bounds.east &&
      restaurant.lng >= bounds.west
  ).length;
}

/** Tên các nguồn dữ liệu quán bên ngoài cần ghi công, không trùng lặp. */
export function collectAttributions(restaurants: Restaurant[]): string[] {
  return [...new Set(restaurants.map((restaurant) => restaurant.attribution.trim()).filter(Boolean))];
}
