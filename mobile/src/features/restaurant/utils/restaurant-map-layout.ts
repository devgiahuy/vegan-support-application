import type { RestaurantBounds } from '../types/restaurant.model';

/**
 * Bố cục sơ đồ vị trí tương đối của quán — đồng bộ `frontend/.../restaurant-map-layout.ts` của web.
 * Cùng một khung nhìn (tâm, bán kính, mức phóng, kích thước) vừa dùng để chiếu ghim, vừa dùng để tính khung tìm kiếm.
 */
export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
}

export interface MapViewport {
  center: { lat: number; lng: number };
  radiusM: number;
  zoomFactor: number;
  width: number;
  height: number;
}

export interface MapMarkerGroup {
  id: string;
  x: number;
  y: number;
  members: MapPoint[];
}

const METERS_PER_LATITUDE = 110574;
const MARKER_GAP = 56;
const EDGE_PADDING = 28;

function viewportSpan(view: MapViewport) {
  const heightM = Math.max(100, view.radiusM) * 2 * view.zoomFactor;
  return {
    heightM,
    widthM: heightM * (Math.max(1, view.width) / Math.max(1, view.height)),
    metersPerLongitude: 111320 * Math.max(0.01, Math.cos((view.center.lat * Math.PI) / 180)),
  };
}

/** Cùng một khung nhìn dùng cho cả phép chiếu và yêu cầu "Tìm trong vùng đang xem". */
export function getMapViewportBounds(view: MapViewport): RestaurantBounds {
  const { heightM, widthM, metersPerLongitude } = viewportSpan(view);
  return {
    north: view.center.lat + heightM / 2 / METERS_PER_LATITUDE,
    south: view.center.lat - heightM / 2 / METERS_PER_LATITUDE,
    east: view.center.lng + widthM / 2 / metersPerLongitude,
    west: view.center.lng - widthM / 2 / metersPerLongitude,
  };
}

/** Gom cụm theo pixel màn hình để mọi vùng chạm 44px đều chọn được ở mọi cỡ màn hình. */
export function layoutMapMarkers(points: MapPoint[], view: MapViewport): MapMarkerGroup[] {
  const { heightM, widthM, metersPerLongitude } = viewportSpan(view);
  const projected = points
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
    .map((point) => ({
      point,
      x: view.width / 2 + (((point.lng - view.center.lng) * metersPerLongitude) / widthM) * view.width,
      y: view.height / 2 - (((point.lat - view.center.lat) * METERS_PER_LATITUDE) / heightM) * view.height,
    }))
    // Không kẹp quán ở xa vào mép khung: làm vậy sẽ tạo ra các ghim chồng nhau giả.
    .filter(({ x, y }) => x >= EDGE_PADDING && x <= view.width - EDGE_PADDING && y >= EDGE_PADDING && y <= view.height - EDGE_PADDING)
    .sort((a, b) => a.point.id.localeCompare(b.point.id));

  let groups: MapMarkerGroup[] = projected.map(({ point, x, y }) => ({ id: point.id, x, y, members: [point] }));
  // Tính lại tâm cụm sau mỗi lần gộp: cụm mới không được che ghim bên cạnh.
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const a = groups[i]!;
        const b = groups[j]!;
        if (Math.hypot(a.x - b.x, a.y - b.y) >= MARKER_GAP) continue;
        const members = [...a.members, ...b.members].sort((left, right) => left.id.localeCompare(right.id));
        const count = members.length;
        groups[i] = {
          id: members.map((member) => member.id).join('|'),
          x: (a.x * a.members.length + b.x * b.members.length) / count,
          y: (a.y * a.members.length + b.y * b.members.length) / count,
          members,
        };
        groups = groups.filter((_, index) => index !== j);
        merged = true;
        break outer;
      }
    }
  }
  return groups;
}

/** Khung hợp lệ: đủ bốn mốc là số và bắc > nam, đông > tây (backend yêu cầu đủ cả bốn). */
export function isBoundsUsable(bounds: RestaurantBounds | null | undefined): bounds is RestaurantBounds {
  if (!bounds) return false;
  const { north, south, east, west } = bounds;
  if ([north, south, east, west].some((value) => typeof value !== 'number' || Number.isNaN(value))) return false;
  return north > south && east > west;
}

/** Định dạng tọa độ kiểu Việt Nam (dấu phẩy thập phân), tối đa 4 chữ số thập phân. */
function formatCoord(value: number): string {
  return value.toFixed(4).replace(/\.?0+$/, '').replace('.', ',');
}

/** Nhãn mô tả vùng đang xem; rỗng khi khung không dùng được. */
export function formatBoundsLabel(bounds: RestaurantBounds | null | undefined): string {
  if (!isBoundsUsable(bounds)) return '';
  return `Vùng đang xem: ${formatCoord(bounds.south)} → ${formatCoord(bounds.north)} (vĩ độ), ${formatCoord(bounds.west)} → ${formatCoord(bounds.east)} (kinh độ)`;
}
