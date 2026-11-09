/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { restaurantMapper } from './restaurant.mapper';

const base = { lat: 10.77, lng: 106.7, radiusM: 5000, query: '', source: 'DEVICE' as const };

test('nearby params use the search center by default', () => {
  const params = restaurantMapper.toLocationParams(base);
  assert.equal(params.lat, 10.77);
  assert.equal(params.lng, 106.7);
  assert.equal(params.north, undefined);
  assert.equal(params.locationConsent, 'true');
});

test('a usable viewport replaces lat/lng with the four bounds', () => {
  const params = restaurantMapper.toLocationParams({ ...base, bounds: { north: 10.8, south: 10.7, east: 106.8, west: 106.6 } });
  assert.deepEqual([params.north, params.south, params.east, params.west], [10.8, 10.7, 106.8, 106.6]);
  assert.equal(params.lat, undefined);
  assert.equal(params.lng, undefined);
});

test('an unusable viewport falls back to lat/lng', () => {
  const params = restaurantMapper.toLocationParams({ ...base, bounds: { north: 10.7, south: 10.8, east: 106.8, west: 106.6 } });
  assert.equal(params.lat, 10.77);
  assert.equal(params.north, undefined);
});
