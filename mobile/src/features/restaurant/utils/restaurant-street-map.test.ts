/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Restaurant } from '../types/restaurant.model';
import {
  CLUSTER_MAX_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  areRestaurantBoundsEqual,
  clampZoom,
  collectAttributions,
  countInBounds,
  radiusFitBounds,
  restaurantRadiusPolygon,
  shouldListCluster,
  toRestaurantBounds,
  toRestaurantMapData,
  toSelectedMapData,
} from './restaurant-street-map';

function place(id: string, lat: number | null, lng: number | null, attribution = ''): Restaurant {
  return { id, name: `Quán ${id}`, lat, lng, attribution } as Restaurant;
}

const center = { lat: 10.77, lng: 106.7 };

test('map data keeps list order numbering and skips places without usable coordinates', () => {
  const data = toRestaurantMapData([
    place('a', 10.77, 106.7),
    place('b', null, null),
    place('c', Number.NaN, 106.7),
    place('d', 95, 106.7),
    place('e', 10.78, 106.71),
  ]);
  assert.deepEqual(
    data.features.map((feature) => [feature.id, feature.properties.position]),
    [
      ['a', 1],
      ['e', 5],
    ]
  );
  assert.deepEqual(data.features[0]!.geometry.coordinates, [106.7, 10.77]);
});

test('selected data holds only the chosen drawable place', () => {
  const items = [place('a', 10.77, 106.7), place('b', null, null)];
  assert.equal(toSelectedMapData(items, null).features.length, 0);
  assert.equal(toSelectedMapData(items, 'missing').features.length, 0);
  assert.equal(toSelectedMapData(items, 'b').features.length, 0);
  assert.equal(toSelectedMapData(items, 'a').features[0]!.properties.position, 1);
});

test('radius polygon is a closed ring about the requested distance from the centre', () => {
  const ring = restaurantRadiusPolygon(center, 3000).geometry.coordinates[0]!;
  assert.equal(ring.length, 65);
  assert.deepEqual(ring[0], ring[64]);
  const northMost = Math.max(...ring.map((point) => point[1]));
  // 3 km theo vĩ tuyến ≈ 0,027°.
  assert.ok(Math.abs(northMost - center.lat - 3000 / 111_195) < 0.0005);
});

test('fit bounds enclose the whole search radius around the centre', () => {
  const [west, south, east, north] = radiusFitBounds(center, 5000);
  assert.ok(west < center.lng && east > center.lng);
  assert.ok(south < center.lat && north > center.lat);
  assert.ok(Math.abs(center.lng - west - (east - center.lng)) < 1e-4);
});

test('map bounds convert to the backend shape only when valid', () => {
  assert.deepEqual(toRestaurantBounds([106.6, 10.7, 106.8, 10.9]), { west: 106.6, south: 10.7, east: 106.8, north: 10.9 });
  assert.equal(toRestaurantBounds(null), null);
  assert.equal(toRestaurantBounds([106.6, 10.7, 106.8]), null);
  assert.equal(toRestaurantBounds([106.6, 10.9, 106.8, 10.7]), null);
  assert.equal(toRestaurantBounds([179, 10.7, -179, 10.9]), null);
  assert.equal(toRestaurantBounds([Number.NaN, 10.7, 106.8, 10.9]), null);
});

test('bounds equality ignores identical values and treats null separately', () => {
  const a = { north: 2, south: 1, east: 4, west: 3 };
  assert.ok(areRestaurantBoundsEqual(a, { ...a }));
  assert.ok(!areRestaurantBoundsEqual(a, { ...a, north: 2.1 }));
  assert.ok(areRestaurantBoundsEqual(null, null));
  assert.ok(!areRestaurantBoundsEqual(a, null));
});

test('zoom is clamped and clusters list members only when they cannot be split further', () => {
  assert.equal(clampZoom(0), MAP_MIN_ZOOM);
  assert.equal(clampZoom(99), MAP_MAX_ZOOM);
  assert.equal(clampZoom(13.5), 13.5);
  assert.equal(clampZoom(Number.NaN), MAP_MIN_ZOOM);
  assert.equal(shouldListCluster(CLUSTER_MAX_ZOOM), false);
  assert.equal(shouldListCluster(CLUSTER_MAX_ZOOM + 1), true);
  assert.equal(shouldListCluster(Number.NaN), true);
});

test('counts only drawable places inside the visible bounds', () => {
  const bounds = { north: 10.8, south: 10.7, east: 106.75, west: 106.65 };
  const items = [place('in', 10.77, 106.7), place('out', 11, 106.7), place('none', null, null)];
  assert.equal(countInBounds(items, bounds), 1);
  assert.equal(countInBounds(items, null), 0);
});

test('attributions are trimmed, non-empty and unique', () => {
  assert.deepEqual(collectAttributions([place('a', 1, 1, ' Google Maps '), place('b', 1, 1, 'Google Maps'), place('c', 1, 1, '')]), [
    'Google Maps',
  ]);
});
