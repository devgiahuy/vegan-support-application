import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { restaurantApi } from '../api/restaurant.api';
import type { LocationQuery, SubmitRestaurantInput } from '../types/restaurant.model';

export const RESTAURANT_KEYS = {
  all: ['restaurants'] as const,
  discovery: (query: LocationQuery) => [...RESTAURANT_KEYS.all, 'discovery', query] as const,
  detail: (id: string) => [...RESTAURANT_KEYS.all, 'detail', id] as const,
  mine: () => [...RESTAURANT_KEYS.all, 'mine'] as const,
};

/** Khám phá quán gần vị trí — tự phân nhánh `nearby`/`search` theo từ khóa. */
export function useRestaurantDiscoveryQuery(query: LocationQuery | null) {
  return useInfiniteQuery({
    queryKey: query ? RESTAURANT_KEYS.discovery(query) : [...RESTAURANT_KEYS.all, 'discovery', 'idle'],
    queryFn: ({ pageParam }) => restaurantApi.discover(query as LocationQuery, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((total, page) => total + page.items.length, 0);
      return lastPage.items.length > 0 && loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
    enabled: query !== null,
  });
}

export function useRestaurantDetailQuery(id: string) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.detail(id),
    queryFn: () => restaurantApi.getDetail(id),
    staleTime: 2 * 60 * 1000,
    enabled: id.length > 0,
  });
}

/** Đổi địa chỉ thành tọa độ. Lỗi do màn gọi tự xử lý (hiện thông báo tại chỗ). */
export function useGeocodeMutation() {
  return useMutation({
    mutationFn: (address: string) => restaurantApi.geocode(address),
  });
}

/** Gửi quán mới vào hàng chờ duyệt. */
export function useSubmitRestaurantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitRestaurantInput) => restaurantApi.submit(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.mine() });
    },
  });
}

/** Các quán tôi đã đề xuất. */
export function useMyRestaurantsQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: RESTAURANT_KEYS.mine(),
    queryFn: () => restaurantApi.getMine(),
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}
