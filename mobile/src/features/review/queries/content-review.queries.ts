import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentReviewApi } from '../api/content-review.api';
import type { ContentReviewDecision, ContentReviewQueueQuery } from '../types/content-review.model';

export const CONTENT_REVIEW_QUERY_KEYS = {
  all: ['content-review'] as const,
  queue: (query: ContentReviewQueueQuery) => [...CONTENT_REVIEW_QUERY_KEYS.all, 'queue', query] as const,
  detail: (revisionId: string) => [...CONTENT_REVIEW_QUERY_KEYS.all, 'detail', revisionId] as const,
};

export function useContentReviewQueueQuery(query: ContentReviewQueueQuery, enabled = true) {
  return useQuery({
    queryKey: CONTENT_REVIEW_QUERY_KEYS.queue(query),
    queryFn: () => contentReviewApi.getQueue(query),
    enabled,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useContentReviewDetailQuery(revisionId: string, enabled = true) {
  return useQuery({
    queryKey: CONTENT_REVIEW_QUERY_KEYS.detail(revisionId),
    queryFn: () => contentReviewApi.getDetail(revisionId),
    enabled: enabled && revisionId.length > 0,
    staleTime: 30 * 1000,
  });
}

/** Quyết định xong thì hàng chờ và mọi danh sách nội dung công khai/của tôi đều phải tải lại. */
export function useContentReviewDecisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { revisionId: string; decision: ContentReviewDecision; reason: string }) =>
      contentReviewApi.decide(input.revisionId, input.decision, input.reason),
    onSettled: () => {
      for (const queryKey of [CONTENT_REVIEW_QUERY_KEYS.all, ['recipes'], ['articles'], ['videos'], ['review']]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
