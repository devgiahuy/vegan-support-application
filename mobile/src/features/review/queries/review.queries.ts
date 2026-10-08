import { useQuery } from '@tanstack/react-query';
import { reviewApi } from '../api/review.api';

export const REVIEW_QUERY_KEYS = {
  all: ['review'] as const,
  history: (postId: string) => [...REVIEW_QUERY_KEYS.all, 'history', postId] as const,
};

/** Lịch sử duyệt của một bài; chỉ gọi khi người dùng mở hộp lịch sử. */
export function useReviewHistoryQuery(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.history(postId),
    queryFn: () => reviewApi.getHistory(postId),
    enabled: enabled && postId.length > 0,
    staleTime: 30 * 1000,
  });
}
