import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorCode, toastApiError } from '@/lib/api-error';
import { moderationApi } from '../api/moderation.api';
import type { MemberStatus, ModerationDecision } from '@/common/enums';
import type { ModerationQueryParams } from '../types/moderation.model';

export const MODERATION_KEYS = {
  all: ['moderation-admin'] as const,
  reports: (params?: ModerationQueryParams) =>
    [...MODERATION_KEYS.all, 'reports', params ?? {}] as const,
  users: (params?: ModerationQueryParams) =>
    [...MODERATION_KEYS.all, 'users', params ?? {}] as const,
  comments: (params?: ModerationQueryParams) =>
    [...MODERATION_KEYS.all, 'comments', params ?? {}] as const,
};

/** Hàng chờ báo cáo gộp theo target (fixture ở phase scaffold). */
export function useReportsQuery(params?: ModerationQueryParams) {
  return useQuery({
    queryKey: MODERATION_KEYS.reports(params),
    queryFn: () => moderationApi.getReports(params),
    staleTime: 30 * 1000,
  });
}

/** Resolve toàn bộ báo cáo đang mở của 1 target. */
export function useResolveReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; decision: ModerationDecision; reason: string }) =>
      moderationApi.resolveReport(vars.id, vars.decision, vars.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODERATION_KEYS.reports() });
      toast.success('Đã xử lý báo cáo.');
    },
    onError: (err: unknown) => {
      if (getApiErrorCode(err) === 'REPORT_REVIEW_CONFLICT') {
        queryClient.invalidateQueries({ queryKey: MODERATION_KEYS.reports() });
        toast.error('Báo cáo đã được xử lý', { description: 'Vui lòng tải lại hàng chờ.' });
        return;
      }
      toastApiError(err, 'Không thể xử lý báo cáo');
    },
  });
}

/** Danh sách user dưới góc admin (fixture). */
export function useModeratedUsersQuery(params?: ModerationQueryParams) {
  return useQuery({
    queryKey: MODERATION_KEYS.users(params),
    queryFn: () => moderationApi.getUsers(params),
    staleTime: 30 * 1000,
  });
}

/** Đổi trạng thái tài khoản (fixture). */
export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: MemberStatus; reason: string }) =>
      moderationApi.updateUserStatus(vars.id, vars.status, vars.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODERATION_KEYS.users() });
      toast.success('Đã cập nhật trạng thái tài khoản.');
    },
    onError: (err: unknown) => {
      const code = getApiErrorCode(err);
      if (code === 'SELF_MODERATION_FORBIDDEN') {
        toast.error('Không thể tự đổi trạng thái tài khoản của chính mình.');
        return;
      }
      if (code === 'PROTECTED_ADMIN_ACCOUNT') {
        toast.error('Tài khoản admin được bảo vệ, không thể kiểm duyệt ở đây.');
        return;
      }
      if (code === 'USER_STATUS_CONFLICT') {
        queryClient.invalidateQueries({ queryKey: MODERATION_KEYS.users() });
        toast.error('Trạng thái đã thay đổi', { description: 'Vui lòng tải lại danh sách.' });
        return;
      }
      toastApiError(err, 'Không thể cập nhật tài khoản');
    },
  });
}

/** Danh sách bình luận kiểm duyệt (fixture). */
export function useModeratedCommentsQuery(params?: ModerationQueryParams) {
  return useQuery({
    queryKey: MODERATION_KEYS.comments(params),
    queryFn: () => moderationApi.getModComments(params),
    staleTime: 30 * 1000,
  });
}

/** Ẩn/khôi phục bình luận (fixture). */
export function useUpdateCommentStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: 'VISIBLE' | 'HIDDEN'; reason: string }) =>
      moderationApi.updateCommentStatus(vars.id, vars.status, vars.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODERATION_KEYS.comments() });
      toast.success('Đã cập nhật bình luận.');
    },
    onError: (err: unknown) => {
      if (getApiErrorCode(err) === 'COMMENT_NOT_MODERATABLE') {
        toast.error('Bình luận đã bị tác giả xóa, không thể thao tác.');
        return;
      }
      toastApiError(err, 'Không thể cập nhật bình luận');
    },
  });
}
