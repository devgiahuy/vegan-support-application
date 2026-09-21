import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEYS } from '@/features/auth/queries/auth.queries';
import { useAuthStore } from '@/store/useAuthStore';
import { profileApi } from '../api/profile.api';

export const PROFILE_QUERY_KEYS = {
  all: ['profile'] as const,
  detail: () => [...PROFILE_QUERY_KEYS.all, 'detail'] as const,
};

export const useDetailedProfileQuery = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.detail(),
    queryFn: () => profileApi.getDetailedProfile(),
    enabled: isAuthenticated,
  });
};

export const useUpdateBasicProfileMutation = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (payload: { displayName?: string; avatarUrl?: string | null }) =>
      profileApi.patchBasicProfile(payload),
    onSuccess: (profile) => {
      setUser(profile.user);
      queryClient.setQueryData(PROFILE_QUERY_KEYS.detail(), profile);
      queryClient.setQueryData(AUTH_QUERY_KEYS.me(), profile.user);
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.all });
    },
  });
};

