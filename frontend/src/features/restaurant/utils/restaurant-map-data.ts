import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';
import type { Restaurant, RestaurantBounds } from '../types/restaurant.model';
import { isBoundsUsable } from './restaurant-bounds';

export interface RestaurantMapPoint {
  id: string;
  name: string;
  position: number;
}

const EARTH_RADIUS_M = 6_371_000;

export function toRestaurantMapData(
  restaurants: Restaurant[]
): FeatureCollection<Point, RestaurantMapPoint> {
  return {
    type: 'FeatureCollection',
    features: restaurants.flatMap((restaurant, index) => {
      const { lat, lng } = restaurant;
      if (
        !restaurant.hasCoordinates ||
        lat === null ||
        lng === null ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 85.051129 ||
        Math.abs(lng) > 180
      )
        return [];
      return [
        {
          type: 'Feature' as const,
          id: restaurant.id,
          geometry: { type: 'Point' as const, coordinates: [lng, lat] },
          properties: { id: restaurant.id, name: restaurant.name, position: index + 1 },
        },
      ];
    }),
  };
}

/** Search footprint, not a route or a claim of travel distance. */
export function restaurantRadiusPolygon(
  center: { lat: number; lng: number },
  radiusM: number
): Feature<Polygon> {
  const lat = (center.lat * Math.PI) / 180;
  const lng = (center.lng * Math.PI) / 180;
  const distance = radiusM / EARTH_RADIUS_M;
  const coordinates = Array.from({ length: 65 }, (_, index) => {
    const bearing = (index * 2 * Math.PI) / 64;
    const pointLat = Math.asin(
      Math.sin(lat) * Math.cos(distance) + Math.cos(lat) * Math.sin(distance) * Math.cos(bearing)
    );
    const pointLng =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distance) * Math.cos(lat),
        Math.cos(distance) - Math.sin(lat) * Math.sin(pointLat)
      );
    return [(pointLng * 180) / Math.PI, (pointLat * 180) / Math.PI];
  });
  coordinates[64] = [...coordinates[0]];
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coordinates] },
  };
}

/** Match the backend's 50 km half-diagonal limit before offering area search. */
export function isRestaurantSearchArea(
  bounds: RestaurantBounds | null
): bounds is RestaurantBounds {
  if (!isBoundsUsable(bounds)) return false;
  const { north, south, east, west } = bounds;
  if (![north, south, east, west].every(Number.isFinite)) return false;
  if (Math.abs(north) > 90 || Math.abs(south) > 90 || Math.abs(east) > 180 || Math.abs(west) > 180)
    return false;
  const radians = Math.PI / 180;
  const h =
    Math.sin(((north - south) * radians) / 2) ** 2 +
    Math.cos(south * radians) *
      Math.cos(north * radians) *
      Math.sin(((east - west) * radians) / 2) ** 2;
  return EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h))) <= 50_000;
}
