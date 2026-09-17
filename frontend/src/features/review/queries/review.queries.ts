import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorCode, toastApiError } from '@/lib/api-error';
import { reviewApi } from '../api/review.api';
import type { ReviewQueueQueryParams } from '../types/review.model';

export const REVIEW_QUEUE_KEYS = {
  all: ['review-queue'] as const,
  list: (params?: ReviewQueueQueryParams) => [...REVIEW_QUEUE_KEYS.all, 'list', params] as const,
};

/**
 * Hook truy vấn hàng chờ kiểm duyệt
 */
export function useReviewQueueQuery(params?: ReviewQueueQueryParams) {
  return useQuery({
    queryKey: REVIEW_QUEUE_KEYS.list(params),
    queryFn: () => reviewApi.getReviewQueue(params),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook duyệt bài (reason bắt buộc)
 */
export function useApprovePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: string }) =>
      reviewApi.approvePost(postId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_QUEUE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Đã duyệt bài viết!', {
        description: 'Bài viết đã được xuất bản công khai.',
      });
    },
    onError: (err: unknown) => {
      if (getApiErrorCode(err) === 'SELF_APPROVAL_FORBIDDEN') {
        toast.error('Không thể duyệt bài này', {
          description: 'Bạn không được tự duyệt bài do chính mình tạo ra.',
        });
        return;
      }
      toastApiError(err, 'Không thể duyệt bài viết');
    },
  });
}

/**
 * Hook từ chối bài (reason bắt buộc để tác giả sửa lại)
 */
export function useRejectPostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: string }) =>
      reviewApi.rejectPost(postId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_QUEUE_KEYS.all });
      toast.success('Đã từ chối bài viết!', {
        description: 'Lý do đã được gửi cho tác giả để chỉnh sửa.',
      });
    },
    onError: (err: unknown) => {
      if (getApiErrorCode(err) === 'SELF_APPROVAL_FORBIDDEN') {
        toast.error('Không thể xử lý bài này', {
          description: 'Bạn không được tự duyệt bài do chính mình tạo ra.',
        });
        return;
      }
      toastApiError(err, 'Không thể từ chối bài viết');
    },
  });
}
