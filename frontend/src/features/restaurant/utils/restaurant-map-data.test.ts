import { describe, expect, it } from 'vitest';
import { restaurantMapper } from '../mappers/restaurant.mapper';
import {
  isRestaurantSearchArea,
  restaurantRadiusPolygon,
  toRestaurantMapData,
} from './restaurant-map-data';

describe('restaurant street-map data', () => {
  it('keeps backend IDs, GeoJSON coordinate order and list positions when invalid pins are omitted', () => {
    const items = [
      restaurantMapper.toModel({ id: 'missing', name: 'Missing' }),
      restaurantMapper.toModel({
        id: 'valid',
        name: '<script>data only</script>',
        latitude: 10.77,
        longitude: 106.69,
      }),
      restaurantMapper.toModel({ id: 'invalid', latitude: 100, longitude: 106 }),
    ];
    const data = toRestaurantMapData(items);
    expect(data.features).toHaveLength(1);
    expect(data.features[0]).toMatchObject({
      id: 'valid',
      geometry: { type: 'Point', coordinates: [106.69, 10.77] },
      properties: { id: 'valid', position: 2, name: '<script>data only</script>' },
    });
  });

  it('keeps equator/prime-meridian coordinates and excludes NaN/Infinity', () => {
    const base = restaurantMapper.toModel({ id: 'zero', latitude: 0, longitude: 0 });
    const data = toRestaurantMapData([
      base,
      { ...base, id: 'nan', lat: Number.NaN },
      { ...base, id: 'infinite', lng: Infinity },
    ]);
    expect(data.features.map((feature) => feature.properties.id)).toEqual(['zero']);
  });

  it('creates an exactly closed geodesic radius ring, including at zero coordinates', () => {
    const ring = restaurantRadiusPolygon({ lat: 0, lng: 0 }, 5000).geometry.coordinates[0];
    expect(ring).toHaveLength(65);
    expect(ring[64]).toEqual(ring[0]);
    for (const [lng, lat] of ring) {
      const r = Math.PI / 180;
      const h = Math.sin((lat * r) / 2) ** 2 + Math.cos(lat * r) * Math.sin((lng * r) / 2) ** 2;
      expect(2 * 6_371_000 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))).toBeCloseTo(5000, 4);
    }
  });
});

describe('area search matches backend bounds limits', () => {
  it('accepts a local viewport but rejects a viewport exceeding the 50km half-diagonal cap', () => {
    expect(isRestaurantSearchArea({ north: 10.8, south: 10.7, east: 106.75, west: 106.65 })).toBe(
      true
    );
    expect(isRestaurantSearchArea({ north: 12, south: 10, east: 108, west: 106 })).toBe(false);
  });

  it('rejects incomplete, inverted, nonfinite and out-of-range bounds', () => {
    expect(isRestaurantSearchArea(null)).toBe(false);
    expect(isRestaurantSearchArea({ north: 10, south: 11, east: 107, west: 106 })).toBe(false);
    expect(isRestaurantSearchArea({ north: Infinity, south: 10, east: 107, west: 106 })).toBe(
      false
    );
    expect(isRestaurantSearchArea({ north: 10.8, south: 10.7, east: 181, west: 180.9 })).toBe(
      false
    );
  });
});
