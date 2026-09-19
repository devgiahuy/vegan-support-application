import { useMutation, useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../api/restaurant.api';
import type { LocationQuery } from '../types/restaurant.model';

export const RESTAURANT_KEYS = {
  all: ['restaurants'] as const,
  search: (query: LocationQuery) => [...RESTAURANT_KEYS.all, 'search', query] as const,
};

/** Tìm quán theo vị trí + từ món (fixture ở phase scaffold, BE còn PLANNED). */
export function useRestaurantSearchQuery(query: LocationQuery, enabled = true) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.search(query),
    queryFn: () => restaurantApi.search(query),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

/** Geocode địa chỉ text nhập tay (fixture vài mẫu). */
export function useGeocodeMutation() {
  return useMutation({
    mutationFn: (address: string) => restaurantApi.geocode(address),
  });
}
