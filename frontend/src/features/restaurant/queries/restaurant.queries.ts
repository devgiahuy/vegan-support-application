import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/api-error';
import { restaurantApi } from '../api/restaurant.api';
import type { LocationQuery, SubmitRestaurantInput } from '../types/restaurant.model';

export const RESTAURANT_KEYS = {
  all: ['restaurants'] as const,
  nearby: (query: LocationQuery) => [...RESTAURANT_KEYS.all, 'nearby', query] as const,
  search: (query: LocationQuery) => [...RESTAURANT_KEYS.all, 'search', query] as const,
  detail: (id: string) => [...RESTAURANT_KEYS.all, 'detail', id] as const,
  queue: () => [...RESTAURANT_KEYS.all, 'queue'] as const,
};

/** Quán gần vị trí/tọa độ (GET /restaurants/nearby). */
export function useNearbyRestaurantsQuery(query: LocationQuery, enabled = true) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.nearby(query),
    queryFn: () => restaurantApi.getNearby(query),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

/** Tìm theo món ăn (GET /restaurants/search). */
export function useRestaurantSearchQuery(query: LocationQuery, enabled = true) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.search(query),
    queryFn: () => restaurantApi.search(query),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

/**
 * Hook tìm quán khám phá hợp nhất (tự động phân nhánh nearby vs search):
 * - Nếu query có từ khóa >= 2 ký tự: gọi search endpoint (/restaurants/search).
 * - Ngược lại: gọi nearby endpoint (/restaurants/nearby).
 */
export function useRestaurantDiscoveryQuery(query: LocationQuery, enabled = true) {
  const hasKeyword = Boolean(query.query && query.query.trim().length >= 2);
  return useQuery({
    queryKey: hasKeyword ? RESTAURANT_KEYS.search(query) : RESTAURANT_KEYS.nearby(query),
    queryFn: () => (hasKeyword ? restaurantApi.search(query) : restaurantApi.getNearby(query)),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

/** Chi tiết 1 quán (fixture). */
export function useRestaurantDetailQuery(id: string) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.detail(id),
    queryFn: () => restaurantApi.getDetail(id),
    staleTime: 2 * 60 * 1000,
    enabled: id.length > 0,
  });
}

/** Gửi quán mới vào chờ (không hiện công khai). */
export function useSubmitRestaurantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitRestaurantInput) => restaurantApi.submitRestaurant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.queue() });
      toast.success('Đã gửi quán mới!', { description: 'Quán đang chờ duyệt trước khi hiển thị.' });
    },
    onError: (err: unknown) => toastApiError(err, 'Không thể gửi quán'),
  });
}

/** Geocode địa chỉ text (fixture vài mẫu). */
export function useGeocodeMutation() {
  return useMutation({
    mutationFn: (address: string) => restaurantApi.geocode(address),
    onError: (err: unknown) => toastApiError(err, 'Không phân giải được địa chỉ'),
  });
}

/** Hàng chờ admin (fixture). */
export function useRestaurantQueueQuery() {
  return useQuery({
    queryKey: RESTAURANT_KEYS.queue(),
    queryFn: () => restaurantApi.getQueue(),
    staleTime: 30 * 1000,
  });
}

/** Admin duyệt/từ chối (fixture). */
export function useReviewRestaurantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; decision: 'APPROVE' | 'REJECT'; reason?: string }) =>
      restaurantApi.reviewRestaurant(vars.id, vars.decision, vars.reason),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.queue() });
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.all });
      toast.success(vars.decision === 'APPROVE' ? 'Đã duyệt quán.' : 'Đã từ chối quán.');
    },
    onError: (err: unknown) => toastApiError(err, 'Không thể xử lý quán'),
  });
}
