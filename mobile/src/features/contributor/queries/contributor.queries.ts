import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contributorApi, type SubmitContributorApplicationInput } from '../api/contributor.api';
import { useAuthStore } from '@/store/useAuthStore';

export const CONTRIBUTOR_QUERY_KEYS = {
  all: ['contributor-applications'] as const,
  mine: (params?: { page?: number; limit?: number }) =>
    [...CONTRIBUTOR_QUERY_KEYS.all, 'me', params ?? {}] as const,
};

/** Toàn bộ đơn nguyện vọng Contributor của user hiện tại — chỉ để hiển thị (BL-01). */
export function useMyContributorApplicationsQuery(params?: { page?: number; limit?: number }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: CONTRIBUTOR_QUERY_KEYS.mine(params),
    queryFn: () => contributorApi.getMyApplications(params),
    enabled: isAuthenticated,
  });
}

export function useSubmitContributorApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitContributorApplicationInput) => contributorApi.submitApplication(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CONTRIBUTOR_QUERY_KEYS.all });
    },
  });
}
