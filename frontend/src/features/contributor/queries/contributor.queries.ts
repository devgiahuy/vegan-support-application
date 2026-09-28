import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorCode, toastApiError } from '@/lib/api-error';
import { contributorApi } from '../api/contributor.api';
import type { ContributorQueueParams, ReviewApplicationInput } from '../types/contributor.model';

export const CONTRIBUTOR_KEYS = {
  all: ['contributor-applications'] as const,
  mine: () => [...CONTRIBUTOR_KEYS.all, 'mine'] as const,
  queue: (params?: ContributorQueueParams) =>
    [...CONTRIBUTOR_KEYS.all, 'queue', params ?? {}] as const,
};

/** Lịch sử đơn của chính mình. */
export function useMyApplicationsQuery() {
  return useQuery({
    queryKey: CONTRIBUTOR_KEYS.mine(),
    queryFn: () => contributorApi.getMyApplications(),
    staleTime: 60 * 1000,
  });
}

/** Nộp đơn mới (luôn PENDING, không tự cấp quyền). */
export function useSubmitApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      claimedApprovalBasis: 'ORGANIZATION_AFFILIATION' | 'PLATFORM_TRACK_RECORD';
      experience: string;
      organizationClaim?: string;
      referenceLinks?: string[];
    }) =>
      contributorApi.submitApplication(
        vars.claimedApprovalBasis,
        vars.experience,
        vars.organizationClaim,
        vars.referenceLinks
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRIBUTOR_KEYS.mine() });
      toast.success('Đã gửi đơn!', { description: 'Đơn của bạn đang chờ duyệt.' });
    },
    onError: (err: unknown) => {
      const code = getApiErrorCode(err);
      if (code === 'CONTRIBUTOR_APPLICATION_PENDING') {
        toast.error('Bạn đã có đơn đang chờ', {
          description: 'Hãy theo dõi đơn hiện có thay vì gửi mới.',
        });
        return;
      }
      if (code === 'CONTRIBUTOR_REAPPLY_NOT_ALLOWED') {
        toast.error('Chưa đến thời gian nộp lại', {
          description: 'Vui lòng chờ đến ngày được phép.',
        });
        return;
      }
      toastApiError(err, 'Không thể gửi đơn');
    },
  });
}

/** Hàng chờ admin. */
export function useContributorQueueQuery(params?: ContributorQueueParams) {
  return useQuery({
    queryKey: CONTRIBUTOR_KEYS.queue(params),
    queryFn: () => contributorApi.getQueue(params),
    staleTime: 30 * 1000,
  });
}

/** Admin duyệt/từ chối đơn. */
export function useReviewApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; input: ReviewApplicationInput }) =>
      contributorApi.reviewApplication(vars.id, vars.input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: CONTRIBUTOR_KEYS.queue() });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(vars.input.decision === 'APPROVE' ? 'Đã duyệt đơn.' : 'Đã từ chối đơn.');
    },
    onError: (err: unknown) => {
      if (getApiErrorCode(err) === 'CONTRIBUTOR_APPLICATION_ALREADY_REVIEWED') {
        queryClient.invalidateQueries({ queryKey: CONTRIBUTOR_KEYS.queue() });
        toast.error('Đơn đã được xử lý', { description: 'Vui lòng tải lại hàng chờ.' });
        return;
      }
      toastApiError(err, 'Không thể xử lý đơn');
    },
  });
}

/** Admin trực tiếp mời một Member thành Contributor. */
export function useInviteContributorAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: string; reason: string }) =>
      contributorApi.inviteContributor(vars.userId, vars.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRIBUTOR_KEYS.queue() });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Đã gửi lời mời Contributor thành công!');
    },
    onError: (err: unknown) => {
      toastApiError(err, 'Không thể gửi lời mời Contributor');
    },
  });
}

/** Admin thu hồi tư cách Contributor của người dùng. */
export function useRevokeContributorAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: string; reason: string }) =>
      contributorApi.revokeContributor(vars.userId, vars.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRIBUTOR_KEYS.queue() });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Đã thu hồi quyền Contributor của người dùng thành công.');
    },
    onError: (err: unknown) => {
      toastApiError(err, 'Không thể thu hồi quyền Contributor');
    },
  });
}
