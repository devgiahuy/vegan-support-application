/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Restaurant } from '../types/restaurant.model';
import { buildMapPins, canPinOnMap, distanceMeters, zoomForRadius } from './map-pins';

function place(id: string, source: string, lat: number | null, lng: number | null): Restaurant {
  return { id, source, lat, lng } as Restaurant;
}

test('only internal or demo places with coordinates get a pin, numbered by list position', () => {
  const pins = buildMapPins([
    place('a', 'GOOGLE', 10.77, 106.7),
    place('b', 'INTERNAL', 10.78, 106.71),
    place('c', 'SERPAPI', 10.79, 106.72),
    place('d', 'INTERNAL', null, null),
    place('e', 'FAKE', 10.8, 106.73),
  ]);
  assert.deepEqual(
    pins.map((pin) => [pin.id, pin.label]),
    [
      ['b', 2],
      ['e', 5],
    ]
  );
  assert.equal(canPinOnMap(place('x', 'GOOGLE', 1, 1)), false);
});

test('zoom narrows as the search radius grows and stays within sane bounds', () => {
  const near = zoomForRadius(1000, 10.77);
  const far = zoomForRadius(20000, 10.77);
  assert.ok(near > far);
  assert.ok(near <= 17 && far >= 8);
});

test('distanceMeters returns roughly the expected separation', () => {
  const meters = distanceMeters(10.77, 106.7, 10.77, 106.71);
  assert.ok(meters > 1000 && meters < 1200);
  assert.equal(Math.round(distanceMeters(10, 10, 10, 10)), 0);
});
