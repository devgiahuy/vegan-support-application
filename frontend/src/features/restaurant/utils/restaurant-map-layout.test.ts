import { describe, expect, it } from 'vitest';
import { getMapViewportBounds, layoutMapMarkers, type MapViewport } from './restaurant-map-layout';

const view: MapViewport = {
  center: { lat: 10.77, lng: 106.7 },
  radiusM: 5000,
  zoomFactor: 1,
  width: 600,
  height: 400,
};

describe('restaurant schematic map layout', () => {
  it('groups places at identical coordinates without losing members', () => {
    const points = Array.from({ length: 20 }, (_, i) => ({ id: String(i), ...view.center }));
    const groups = layoutMapMarkers(points, view);
    expect(groups).toHaveLength(1);
    expect(groups[0].members).toHaveLength(20);
    expect(groups[0].x).toBe(300);
    expect(groups[0].y).toBe(200);
  });

  it('splits nearby places when zooming in and regroups when zooming out', () => {
    const points = [
      { id: 'a', lat: 10.77, lng: 106.7 },
      { id: 'b', lat: 10.77, lng: 106.708 },
    ];
    expect(layoutMapMarkers(points, view)).toHaveLength(1);
    const zoomed = layoutMapMarkers(points, { ...view, zoomFactor: 0.5 });
    expect(zoomed).toHaveLength(2);
    expect(zoomed[1].x - zoomed[0].x).toBeGreaterThan(56);
    expect(layoutMapMarkers(points, { ...view, zoomFactor: 2 })).toHaveLength(1);
  });

  it('moves the pin by the same zoom ratio', () => {
    const point = { id: 'a', lat: 10.78, lng: 106.71 };
    const normal = layoutMapMarkers([point], view)[0];
    const zoomed = layoutMapMarkers([point], { ...view, zoomFactor: 0.5 })[0];
    expect(zoomed.x - 300).toBeCloseTo((normal.x - 300) * 2);
    expect(zoomed.y - 200).toBeCloseTo((normal.y - 200) * 2);
  });

  it('omits out-of-frame coordinates rather than piling them at the edges', () => {
    expect(layoutMapMarkers([{ id: 'far', lat: 11.5, lng: 107.5 }], view)).toEqual([]);
  });

  it('does not overlap cluster targets even after centroid merges on mobile', () => {
    const points = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      lat: 10.75 + i * 0.002,
      lng: 106.68 + (i % 4) * 0.005,
    }));
    const groups = layoutMapMarkers(points, { ...view, width: 320 });
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        expect(
          Math.hypot(groups[i].x - groups[j].x, groups[i].y - groups[j].y)
        ).toBeGreaterThanOrEqual(56);
      }
    }
    expect(new Set(groups.flatMap((group) => group.members.map((point) => point.id))).size).toBe(
      points.length
    );
  });

  it('keeps grouping deterministic when input order changes', () => {
    const points = [
      { id: 'b', ...view.center },
      { id: 'a', ...view.center },
    ];
    expect(layoutMapMarkers(points, view)).toEqual(layoutMapMarkers([...points].reverse(), view));
  });

  it('uses viewport aspect ratio and zoom for search bounds', () => {
    const bounds = getMapViewportBounds(view);
    const zoomed = getMapViewportBounds({ ...view, zoomFactor: 0.5 });
    expect(bounds.north - view.center.lat).toBeCloseTo(5000 / 110574);
    expect(zoomed.north - view.center.lat).toBeCloseTo((bounds.north - view.center.lat) / 2);
    const portrait = getMapViewportBounds({ ...view, width: 300 });
    expect(portrait.east - view.center.lng).toBeCloseTo((bounds.east - view.center.lng) / 2);
  });

  it('honors a small search radius instead of forcing a 2km scale', () => {
    const bounds = getMapViewportBounds({ ...view, radiusM: 100 });
    expect(bounds.north - view.center.lat).toBeCloseTo(100 / 110574);
  });

  it('ignores invalid coordinates and handles zero coordinates', () => {
    expect(layoutMapMarkers([{ id: 'bad', lat: NaN, lng: 0 }], view)).toEqual([]);
    expect(
      layoutMapMarkers([{ id: 'zero', lat: 0, lng: 0 }], { ...view, center: { lat: 0, lng: 0 } })
    ).toHaveLength(1);
  });
});
