import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile.api';
import { AUTH_QUERY_KEYS } from '@/features/auth/queries/auth.queries';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export const PROFILE_QUERY_KEYS = {
  all: ['profile'] as const,
  detail: () => [...PROFILE_QUERY_KEYS.all, 'detail'] as const,
};

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
      // Đồng bộ header ngay không cần F5, đồng thời làm mới cache liên quan.
      setUser(detailed.user);
      queryClient.setQueryData(PROFILE_QUERY_KEYS.detail(), detailed);
      queryClient.setQueryData(AUTH_QUERY_KEYS.me(), detailed.user);
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.all });
      toast.success('Đã cập nhật hồ sơ.');
    },
  });
};
