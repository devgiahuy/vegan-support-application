import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile.api';
import { AUTH_QUERY_KEYS } from '@/features/auth/queries/auth.queries';
import { RECIPE_QUERY_KEYS } from '@/features/recipe/queries/recipe.queries';
import { VIDEO_QUERY_KEYS } from '@/features/video/queries/video.queries';
import { POST_QUERY_KEYS } from '@/features/post/queries/post.queries';
import { COMMUNITY_KEYS } from '@/features/community/queries/community.queries';
import { ADMIN_CONTENT_QUERY_KEYS } from '@/features/admin-content/queries/admin-content.queries';
import { CONTENT_REVIEW_KEYS } from '@/features/review/queries/review.queries';
import type { User } from '@/features/auth/types/auth.model';
import type { DetailedProfile } from '../types/profile.model';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export const PROFILE_QUERY_KEYS = {
  all: ['profile'] as const,
  detail: () => [...PROFILE_QUERY_KEYS.all, 'detail'] as const,
};

/**
 * Đồng bộ phiên đăng nhập + làm mới các cache nội dung/bình luận có nhúng tên
 * và ảnh đại diện tác giả để thay đổi tại `/profile` phản ánh trên toàn app.
 */
export function syncProfileUpdateCaches(
  queryClient: QueryClient,
  detailed: DetailedProfile,
  setUser: (user: User | null) => void
) {
  setUser(detailed.user);
  queryClient.setQueryData(PROFILE_QUERY_KEYS.detail(), detailed);
  queryClient.setQueryData(AUTH_QUERY_KEYS.me(), detailed.user);
  queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.all });
  queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
  queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.all });
  queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.all });
  queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.all });
  queryClient.invalidateQueries({ queryKey: ADMIN_CONTENT_QUERY_KEYS.all });
  queryClient.invalidateQueries({ queryKey: CONTENT_REVIEW_KEYS.all });
}

export const useDetailedProfileQuery = () => {
  // Chỉ bắn request khi có phiên — tránh 401 vô ích cho guest và tránh
  // request không token trong lúc AuthProvider đang silent-refresh sau F5.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.detail(),
    queryFn: () => profileApi.getDetailedProfile(),
    enabled: isAuthenticated,
  });
};

export const useUpdateBasicProfileMutation = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: { displayName?: string; avatarUrl?: string | null }) =>
      profileApi.patchBasicProfile(payload),
    onSuccess: (detailed) => {
      syncProfileUpdateCaches(queryClient, detailed, setUser);
      toast.success('Đã cập nhật hồ sơ.');
    },
  });
};
