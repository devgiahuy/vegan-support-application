import type { RestaurantBounds } from '../types/restaurant.model';

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

/** The same viewport drives projection and the explicit search-area request. */
export function getMapViewportBounds(view: MapViewport): RestaurantBounds {
  const { heightM, widthM, metersPerLongitude } = viewportSpan(view);
  return {
    north: view.center.lat + heightM / 2 / METERS_PER_LATITUDE,
    south: view.center.lat - heightM / 2 / METERS_PER_LATITUDE,
    east: view.center.lng + widthM / 2 / metersPerLongitude,
    west: view.center.lng - widthM / 2 / metersPerLongitude,
  };
}

/** Cluster in screen pixels so all 44px targets remain selectable at every screen size. */
export function layoutMapMarkers(points: MapPoint[], view: MapViewport): MapMarkerGroup[] {
  const { heightM, widthM, metersPerLongitude } = viewportSpan(view);
  const projected = points
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
    .map((point) => ({
      point,
      x:
        view.width / 2 +
        (((point.lng - view.center.lng) * metersPerLongitude) / widthM) * view.width,
      y:
        view.height / 2 -
        (((point.lat - view.center.lat) * METERS_PER_LATITUDE) / heightM) * view.height,
    }))
    // Do not clamp distant places to the edges: that would manufacture overlapping pins.
    .filter(
      ({ x, y }) =>
        x >= EDGE_PADDING &&
        x <= view.width - EDGE_PADDING &&
        y >= EDGE_PADDING &&
        y <= view.height - EDGE_PADDING
    )
    .sort((a, b) => a.point.id.localeCompare(b.point.id));

  let groups = projected.map(({ point, x, y }) => ({ id: point.id, x, y, members: [point] }));
  // Recheck centroids after merging: a newly placed cluster must not cover a neighbor.
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const a = groups[i];
        const b = groups[j];
        if (Math.hypot(a.x - b.x, a.y - b.y) >= MARKER_GAP) continue;
        const members = [...a.members, ...b.members].sort((left, right) =>
          left.id.localeCompare(right.id)
        );
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
