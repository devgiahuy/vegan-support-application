/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMapViewportBounds, isBoundsUsable, layoutMapMarkers, type MapViewport } from './restaurant-map-layout';

const view: MapViewport = { center: { lat: 10.77, lng: 106.7 }, radiusM: 5000, zoomFactor: 1, width: 600, height: 400 };

test('groups places at identical coordinates without losing members', () => {
  const points = Array.from({ length: 20 }, (_, i) => ({ id: String(i), ...view.center }));
  const groups = layoutMapMarkers(points, view);
  assert.equal(groups.length, 1);
  assert.equal(groups[0]!.members.length, 20);
  assert.equal(groups[0]!.x, 300);
  assert.equal(groups[0]!.y, 200);
});

test('splits nearby places when zooming in and regroups when zooming out', () => {
  const points = [
    { id: 'a', lat: 10.77, lng: 106.7 },
    { id: 'b', lat: 10.77, lng: 106.708 },
  ];
  assert.equal(layoutMapMarkers(points, view).length, 1);
  const zoomed = layoutMapMarkers(points, { ...view, zoomFactor: 0.5 });
  assert.equal(zoomed.length, 2);
  assert.ok(zoomed[1]!.x - zoomed[0]!.x > 56);
  assert.equal(layoutMapMarkers(points, { ...view, zoomFactor: 2 }).length, 1);
});

test('omits out-of-frame coordinates rather than piling them at the edges', () => {
  assert.deepEqual(layoutMapMarkers([{ id: 'far', lat: 11.5, lng: 107.5 }], view), []);
});

test('cluster targets never overlap and no place is lost', () => {
  const points = Array.from({ length: 20 }, (_, i) => ({ id: String(i), lat: 10.75 + i * 0.002, lng: 106.68 + (i % 4) * 0.005 }));
  const groups = layoutMapMarkers(points, { ...view, width: 320 });
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      assert.ok(Math.hypot(groups[i]!.x - groups[j]!.x, groups[i]!.y - groups[j]!.y) >= 56);
    }
  }
  assert.equal(new Set(groups.flatMap((group) => group.members.map((point) => point.id))).size, points.length);
});

test('grouping is deterministic when input order changes', () => {
  const points = [
    { id: 'b', ...view.center },
    { id: 'a', ...view.center },
  ];
  assert.deepEqual(layoutMapMarkers(points, view), layoutMapMarkers([...points].reverse(), view));
});

test('search bounds follow radius, zoom and aspect ratio', () => {
  const bounds = getMapViewportBounds(view);
  const zoomed = getMapViewportBounds({ ...view, zoomFactor: 0.5 });
  assert.ok(Math.abs(bounds.north - view.center.lat - 5000 / 110574) < 1e-9);
  assert.ok(Math.abs(zoomed.north - view.center.lat - (bounds.north - view.center.lat) / 2) < 1e-9);
  const portrait = getMapViewportBounds({ ...view, width: 300 });
  assert.ok(Math.abs(portrait.east - view.center.lng - (bounds.east - view.center.lng) / 2) < 1e-9);
  assert.ok(Math.abs(getMapViewportBounds({ ...view, radiusM: 100 }).north - view.center.lat - 100 / 110574) < 1e-9);
});

test('ignores invalid coordinates and validates bounds', () => {
  assert.deepEqual(layoutMapMarkers([{ id: 'bad', lat: Number.NaN, lng: 0 }], view), []);
  assert.equal(layoutMapMarkers([{ id: 'zero', lat: 0, lng: 0 }], { ...view, center: { lat: 0, lng: 0 } }).length, 1);
  assert.equal(isBoundsUsable(getMapViewportBounds(view)), true);
  assert.equal(isBoundsUsable({ north: 1, south: 2, east: 3, west: 2 }), false);
  assert.equal(isBoundsUsable(null), false);
});
