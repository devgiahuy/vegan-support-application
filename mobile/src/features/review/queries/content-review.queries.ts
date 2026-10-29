import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentReviewApi } from '../api/content-review.api';
import type { ContentReviewDecision, ContentReviewQueueQuery } from '../types/content-review.model';
import type { ReviewNutritionOverrideValues } from '../types/review-nutrition.model';

export const CONTENT_REVIEW_QUERY_KEYS = {
  all: ['content-review'] as const,
  queue: (query: ContentReviewQueueQuery) => [...CONTENT_REVIEW_QUERY_KEYS.all, 'queue', query] as const,
  detail: (revisionId: string) => [...CONTENT_REVIEW_QUERY_KEYS.all, 'detail', revisionId] as const,
  nutrition: (revisionId: string) => [...CONTENT_REVIEW_QUERY_KEYS.all, 'nutrition', revisionId] as const,
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

/** Làm mới panel khi job AI còn chạy/hẹn thử lại để người duyệt thấy kết quả mà không cần tải lại. */
const NUTRITION_JOB_POLL_MS = 10_000;

/** `GET /admin/content-review/:id/nutrition` — chỉ dùng cho bản nộp công thức. */
export function useReviewNutritionPanelQuery(revisionId: string, enabled = true) {
  return useQuery({
    queryKey: CONTENT_REVIEW_QUERY_KEYS.nutrition(revisionId),
    queryFn: () => contentReviewApi.getNutritionPanel(revisionId),
    enabled: enabled && revisionId.length > 0,
    staleTime: 5 * 1000,
    refetchInterval: (query) => (query.state.data?.aiJob?.isActive ? NUTRITION_JOB_POLL_MS : false),
  });
}

/** `PATCH .../nutrition` — kết quả trả về là panel mới nên ghi thẳng vào cache. */
export function useUpdateReviewNutritionMutation(revisionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { values: ReviewNutritionOverrideValues; reason?: string }) =>
      contentReviewApi.updateNutritionOverrides(revisionId, input.values, input.reason),
    onSuccess: (panel) => {
      queryClient.setQueryData(CONTENT_REVIEW_QUERY_KEYS.nutrition(revisionId), panel);
    },
  });
}

/** `POST .../nutrition/recalculate` — "AI tính lại" (hệ thống chịu chi phí, không trừ lượt của ai). */
export function useRecalculateReviewNutritionMutation(revisionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => contentReviewApi.recalculateNutrition(revisionId),
    onSuccess: (panel) => {
      queryClient.setQueryData(CONTENT_REVIEW_QUERY_KEYS.nutrition(revisionId), panel);
    },
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
