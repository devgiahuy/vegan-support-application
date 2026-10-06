import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/api-error';
import { restaurantApi } from '../api/restaurant.api';
import { resolveSearchMode } from '../utils/restaurant-search';
import type { RestaurantSearchState, SubmitRestaurantInput } from '../types/restaurant.model';

/**
 * Query Key Factory — bắt buộc theo docs/ARCHITECTURE.md §4.
 * `all` là gốc để `invalidateQueries` xoá được mọi biến thể.
 */
export const RESTAURANT_KEYS = {
  all: ['restaurants'] as const,
  nearby: (state: RestaurantSearchState) =>
    [
      ...RESTAURANT_KEYS.all,
      'nearby',
      state.mode,
      state.radiusM,
      state.lat,
      state.lng,
      state.dietPattern,
    ] as const,
  bounds: (state: RestaurantSearchState) =>
    [...RESTAURANT_KEYS.all, 'bounds', state.bounds, state.dietPattern] as const,
  search: (state: RestaurantSearchState) =>
    [
      ...RESTAURANT_KEYS.all,
      'search',
      state.query,
      state.radiusM,
      state.dietPattern,
      state.advanced,
    ] as const,
  detail: (id: string) => [...RESTAURANT_KEYS.all, 'detail', id] as const,
  queue: () => [...RESTAURANT_KEYS.all, 'queue'] as const,
};

/** Quán gần vị trí/tọa độ hoặc theo khung vùng bản đồ (GET /restaurants/nearby). */
export function useNearbyRestaurantsQuery(state: RestaurantSearchState, enabled = true) {
  const mode = resolveSearchMode(state);
  return useQuery({
    queryKey:
      state.mode === 'BOUNDS' ? RESTAURANT_KEYS.bounds(state) : RESTAURANT_KEYS.nearby(state),
    queryFn: () => restaurantApi.getNearby(state),
    staleTime: 2 * 60 * 1000,
    enabled: enabled && (mode === 'NEARBY' || mode === 'BOUNDS'),
  });
}

/** Tìm theo món ăn/tên quán (GET /restaurants/search). */
export function useRestaurantSearchQuery(state: RestaurantSearchState, enabled = true) {
  const mode = resolveSearchMode(state);
  return useQuery({
    queryKey: RESTAURANT_KEYS.search(state),
    queryFn: () => restaurantApi.search(state),
    staleTime: 2 * 60 * 1000,
    enabled: enabled && mode === 'KEYWORD',
  });
}

/**
 * Hook khám phá hợp nhất — tự phân nhánh theo `resolveSearchMode`:
 * - KEYWORD (từ khóa ≥ 2 ký tự) → `/restaurants/search`
 * - BOUNDS (đủ bốn mốc bản đồ) → `/restaurants/nearby` + north/south/east/west
 * - NEARBY (đủ cặp lat/lng)   → `/restaurants/nearby` + radiusMeters
 * - Trạng thái không hợp lệ    → không gọi request nào (enabled = false)
 */
export function useRestaurantDiscoveryQuery(state: RestaurantSearchState, enabled = true) {
  const mode = resolveSearchMode(state);
  const isKeyword = mode === 'KEYWORD';
  const isBounds = mode === 'BOUNDS';

  return useQuery({
    queryKey: isKeyword
      ? RESTAURANT_KEYS.search(state)
      : isBounds
        ? RESTAURANT_KEYS.bounds(state)
        : RESTAURANT_KEYS.nearby(state),
    queryFn: () => (isKeyword ? restaurantApi.search(state) : restaurantApi.getNearby(state)),
    staleTime: 2 * 60 * 1000,
    enabled: enabled && mode !== null,
  });
}

/** Chi tiết 1 quán. */
export function useRestaurantDetailQuery(id: string) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.detail(id),
    queryFn: () => restaurantApi.getDetail(id),
    staleTime: 2 * 60 * 1000,
    enabled: id.length > 0,
  });
}

/** Gửi quán mới vào hàng chờ duyệt (không hiện công khai). */
export function useSubmitRestaurantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitRestaurantInput) => restaurantApi.submitRestaurant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.all });
      // Nêu rõ điều sẽ xảy ra tiếp theo: kết quả duyệt (kể cả lý do từ chối nếu có) do quản
      // trị viên quyết định và sẽ được thông báo cho thành viên, không phải hiển thị tại đây —
      // trang khám phá không có bề mặt "quán của tôi" trong phạm vi đợt này (US3/AC4).
      toast.success('Đã gửi quán mới!', {
        description:
          'Quán đang chờ duyệt. Kết quả duyệt — kể cả lý do nếu bị từ chối — sẽ được thông báo cho bạn sau.',
        duration: 6000,
      });
    },
    onError: (err: unknown) => toastApiError(err, 'Không thể gửi quán'),
  });
}

/** Phân giải địa chỉ người dùng nhập thành tọa độ. */
export function useGeocodeMutation() {
  return useMutation({
    mutationFn: (address: string) => restaurantApi.geocode(address),
    onError: (err: unknown) => toastApiError(err, 'Không phân giải được địa chỉ'),
  });
}

/** Hàng chờ duyệt của quản trị viên (ngoài phạm vi redesign trang khám phá). */
export function useRestaurantQueueQuery() {
  return useQuery({
    queryKey: RESTAURANT_KEYS.queue(),
    queryFn: () => restaurantApi.getQueue(),
    staleTime: 30 * 1000,
  });
}

/** Quản trị viên duyệt/từ chối quán (ngoài phạm vi redesign trang khám phá). */
export function useReviewRestaurantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; decision: 'APPROVE' | 'REJECT'; reason?: string }) =>
      restaurantApi.reviewRestaurant(vars.id, vars.decision, vars.reason),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.all });
      toast.success(vars.decision === 'APPROVE' ? 'Đã duyệt quán.' : 'Đã từ chối quán.');
    },
    onError: (err: unknown) => toastApiError(err, 'Không thể xử lý quán'),
  });
}
