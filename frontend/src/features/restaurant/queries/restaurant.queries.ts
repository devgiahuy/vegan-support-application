import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
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
  const user = useAuthStore((state) => state.user);
  const identity = user?.id ?? 'guest';
  return useQuery({
    queryKey: [...RESTAURANT_KEYS.nearby(query), identity],
    queryFn: ({ signal }) => restaurantApi.getNearby(query, signal),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

/** Tìm theo món ăn (GET /restaurants/search). */
export function useRestaurantSearchQuery(query: LocationQuery, enabled = true) {
  const user = useAuthStore((state) => state.user);
  const identity = user?.id ?? 'guest';
  return useQuery({
    queryKey: [...RESTAURANT_KEYS.search(query), identity],
    queryFn: ({ signal }) => restaurantApi.search(query, signal),
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
  const user = useAuthStore((state) => state.user);
  const identity = user?.id ?? 'guest';
  return useQuery({
    queryKey: [
      ...(hasKeyword ? RESTAURANT_KEYS.search(query) : RESTAURANT_KEYS.nearby(query)),
      identity,
    ],
    queryFn: ({ signal }) =>
      hasKeyword ? restaurantApi.search(query, signal) : restaurantApi.getNearby(query, signal),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

/** Chi tiết 1 quán. */
export function useRestaurantDetailQuery(id: string) {
  const user = useAuthStore((state) => state.user);
  const identity = user?.id ?? 'guest';
  return useQuery({
    queryKey: [...RESTAURANT_KEYS.detail(id), identity],
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

/** Geocode địa chỉ text. */
export function useGeocodeMutation() {
  return useMutation({
    mutationFn: (address: string) => restaurantApi.geocode(address),
    onError: (err: unknown) => toastApiError(err, 'Không phân giải được địa chỉ'),
  });
}

/** Hàng chờ admin. */
export function useRestaurantQueueQuery() {
  const user = useAuthStore((state) => state.user);
  const identity = user?.id ?? 'guest';
  return useQuery({
    queryKey: [...RESTAURANT_KEYS.queue(), identity],
    queryFn: () => restaurantApi.getQueue(),
    staleTime: 30 * 1000,
  });
}

/** Admin duyệt/từ chối. */
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
