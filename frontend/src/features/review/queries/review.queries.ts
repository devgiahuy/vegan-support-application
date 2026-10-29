import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorCode, getApiErrorFields, toastApiError } from '@/lib/api-error';
import { reviewApi } from '../api/review.api';
import type { ReviewQueueQueryParams, SubmitPostInput } from '../types/content-review.model';
import type { ReviewNutritionOverrideValues } from '../types/review-nutrition.model';
import { ReviewDecisionEnum } from '../types/content-review.model';
import { localizeReviewReasonError } from '../utils/review-error';

// ==========================================
// TanStack Query Key Factory
// ==========================================

export const CONTENT_REVIEW_KEYS = {
  all: ['content-review'] as const,
  queue: (params?: ReviewQueueQueryParams) =>
    [...CONTENT_REVIEW_KEYS.all, 'queue', params] as const,
  detail: (revisionId: string) => [...CONTENT_REVIEW_KEYS.all, 'detail', revisionId] as const,
  history: (postId: string, params?: { page?: number; limit?: number }) =>
    [...CONTENT_REVIEW_KEYS.all, 'history', postId, params] as const,
  nutrition: (revisionId: string) => [...CONTENT_REVIEW_KEYS.all, 'nutrition', revisionId] as const,
};

/** Polling khi job AI còn chạy/hẹn thử lại để người duyệt thấy kết quả mà không cần tải lại */
const NUTRITION_JOB_POLL_MS = 10_000;

/** Alias tương thích ngược cho REVIEW_QUEUE_KEYS */
export const REVIEW_QUEUE_KEYS = {
  all: CONTENT_REVIEW_KEYS.all,
  list: (params?: ReviewQueueQueryParams) => CONTENT_REVIEW_KEYS.queue(params),
};

// ==========================================
// 1. Author Hooks (Phase 16)
// ==========================================

/**
 * Hook nộp bản nháp để Admin kiểm duyệt
 * POST /api/v1/posts/:id/submit
 */
export function useSubmitPostMutation(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitPostInput) => reviewApi.submitPost(postId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENT_REVIEW_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Nộp bài viết kiểm duyệt thành công!', {
        description: 'Bài viết đang chờ Quản trị viên thẩm định và xuất bản.',
      });
    },
    onError: (err: unknown) => {
      const code = getApiErrorCode(err);
      if (code === 'CONTENT_NOT_SUBMITTABLE') {
        toast.error('Chưa thể gửi duyệt', {
          description:
            'Nội dung chưa hoàn thiện các trường bắt buộc (tiêu đề, nguyên liệu hoặc video).',
        });
        return;
      }
      if (code === 'CONTENT_ALREADY_SUBMITTED') {
        toast.warning('Bài viết đã được gửi duyệt', {
          description:
            'Bản nháp này đang ở trạng thái chờ duyệt. Vui lòng chờ Quản trị viên phản hồi.',
        });
        return;
      }
      if (code === 'VERSION_CONFLICT') {
        toast.error('Xung đột phiên bản', {
          description: 'Dữ liệu bài viết đã có thay đổi mới từ nơi khác. Vui lòng tải lại trang.',
        });
        return;
      }
      toastApiError(err, 'Không thể gửi duyệt bài viết');
    },
  });
}

/**
 * Hook truy vấn lịch sử các lần nộp duyệt của bài viết
 * GET /api/v1/posts/:id/review-history
 */
export function useContentReviewHistoryQuery(
  postId: string,
  params?: { page?: number; limit?: number },
  enabled = true
) {
  return useQuery({
    queryKey: CONTENT_REVIEW_KEYS.history(postId, params),
    queryFn: () => reviewApi.getReviewHistory(postId, params),
    enabled: Boolean(postId) && enabled,
    staleTime: 30 * 1000,
  });
}

// ==========================================
// 2. Admin Hooks (Phase 16)
// ==========================================

/**
 * Hook truy vấn danh sách hàng chờ kiểm duyệt Admin
 * GET /api/v1/admin/content-review
 */
export function useAdminContentReviewQueueQuery(params?: ReviewQueueQueryParams) {
  return useQuery({
    queryKey: CONTENT_REVIEW_KEYS.queue(params),
    queryFn: () => reviewApi.getAdminQueue(params),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook xem chi tiết bản nháp nộp duyệt Admin
 * GET /api/v1/admin/content-review/:id
 */
export function useAdminContentReviewDetailQuery(revisionId: string, enabled = true) {
  return useQuery({
    queryKey: CONTENT_REVIEW_KEYS.detail(revisionId),
    queryFn: () => reviewApi.getAdminDetail(revisionId),
    enabled: Boolean(revisionId) && enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook ra quyết định kiểm duyệt Admin (Phê duyệt hoặc Từ chối kèm lý do)
 * PATCH /api/v1/admin/content-review/:id
 */
export function useAdminContentReviewDecisionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      revisionId,
      decision,
      reason,
    }: {
      revisionId: string;
      decision: ReviewDecisionEnum;
      reason: string;
    }) => reviewApi.makeDecision(revisionId, decision, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CONTENT_REVIEW_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });

      const isApprove = variables.decision === ReviewDecisionEnum.APPROVE;
      if (isApprove) {
        toast.success('Đã phê duyệt bài viết!', {
          description: 'Nội dung đã được xuất bản công khai cho cộng đồng.',
        });
      } else {
        toast.success('Đã từ chối bài viết!', {
          description: 'Lý do từ chối đã được gửi về cho tác giả để chỉnh sửa.',
        });
      }
    },
    onError: (err: unknown, variables) => {
      const isApprove = variables?.decision === ReviewDecisionEnum.APPROVE;
      const code = getApiErrorCode(err);
      if (code === 'SELF_APPROVAL_FORBIDDEN') {
        toast.error('Không thể tự duyệt', {
          description:
            'Bạn không thể tự thẩm định nội dung do chính mình tạo ra. Vui lòng để Quản trị viên khác xử lý.',
        });
        return;
      }
      if (code === 'RECIPE_NUTRITION_INCOMPLETE') {
        toast.error('Chưa đủ chỉ số dinh dưỡng', {
          description:
            'Cần đủ 5 chỉ số trên mỗi khẩu phần (năng lượng, protein, carbohydrate, chất béo, chất xơ). Hãy nhập tay chỉ số còn trống hoặc bấm "AI tính lại".',
        });
        queryClient.invalidateQueries({
          queryKey: CONTENT_REVIEW_KEYS.nutrition(variables.revisionId),
        });
        return;
      }
      if (code === 'REVIEW_CONFLICT') {
        toast.error('Xung đột thẩm định', {
          description:
            'Bản nháp này đã được một Quản trị viên khác thẩm định trước đó. Hàng chờ sẽ được tải lại.',
        });
        queryClient.invalidateQueries({ queryKey: CONTENT_REVIEW_KEYS.all });
        return;
      }

      // Kiểm tra lỗi trường lý do để hiển thị tiếng Việt rõ ràng cho người dùng
      const fields = getApiErrorFields(err);
      if (fields?.reason) {
        const rawMsg = Array.isArray(fields.reason)
          ? fields.reason.map((m) => String(m)).join(', ')
          : String(fields.reason);
        const translatedReason = localizeReviewReasonError(rawMsg, isApprove);
        toast.error('Không thể hoàn tất quyết định kiểm duyệt', {
          description: translatedReason,
        });
        return;
      }

      if (fields?.decision) {
        toast.error('Không thể hoàn tất quyết định kiểm duyệt', {
          description: 'Quyết định kiểm duyệt không hợp lệ.',
        });
        return;
      }

      toastApiError(err, 'Không thể hoàn tất quyết định kiểm duyệt');
    },
  });
}

// ==========================================
// 2b. Dinh dưỡng công thức khi duyệt
// ==========================================

function toastNutritionReviewError(err: unknown, title: string) {
  const code = getApiErrorCode(err);
  if (code === 'SELF_APPROVAL_FORBIDDEN') {
    toast.error(title, { description: 'Bạn không thể duyệt công thức do chính mình tạo.' });
    return;
  }
  if (code === 'ADMIN_REVIEW_REQUIRED') {
    toast.error(title, {
      description: 'Bản nộp này cần Quản trị viên xử lý (có cảnh báo hoặc nhiều báo cáo).',
    });
    return;
  }
  if (code === 'REVIEW_ALREADY_DECIDED' || code === 'CONTENT_STATE_CONFLICT') {
    toast.error(title, { description: 'Bản nộp không còn ở trạng thái chờ duyệt.' });
    return;
  }
  if (code === 'INVALID_CONTENT') {
    toast.error(title, { description: 'Bản nộp này không phải công thức có dữ liệu cấu trúc.' });
    return;
  }
  toastApiError(err, title);
}

/**
 * Panel dinh dưỡng cho người duyệt; tự làm mới khi job AI còn đang chạy
 * GET /api/v1/admin/content-review/:id/nutrition
 */
export function useReviewNutritionPanelQuery(revisionId: string, enabled = true) {
  return useQuery({
    queryKey: CONTENT_REVIEW_KEYS.nutrition(revisionId),
    queryFn: () => reviewApi.getNutritionPanel(revisionId),
    enabled: Boolean(revisionId) && enabled,
    staleTime: 5 * 1000,
    refetchInterval: (query) => (query.state.data?.aiJob?.isActive ? NUTRITION_JOB_POLL_MS : false),
  });
}

/**
 * Người duyệt sửa tay / bỏ sửa tay chỉ số dinh dưỡng
 * PATCH /api/v1/admin/content-review/:id/nutrition
 */
export function useUpdateReviewNutritionMutation(revisionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ values, reason }: { values: ReviewNutritionOverrideValues; reason?: string }) =>
      reviewApi.updateNutritionOverrides(revisionId, values, reason),
    onSuccess: (panel) => {
      queryClient.setQueryData(CONTENT_REVIEW_KEYS.nutrition(revisionId), panel);
      toast.success('Đã lưu chỉ số dinh dưỡng', {
        description: 'Chỉnh sửa được ghi lại kèm người sửa và thời điểm.',
      });
    },
    onError: (err: unknown) => {
      const fields = getApiErrorFields(err);
      if (getApiErrorCode(err) === 'VALIDATION_ERROR' && fields) {
        toast.error('Không thể lưu chỉ số dinh dưỡng', {
          description: 'Giá trị phải là số không âm và nhỏ hơn 100.000.',
        });
        return;
      }
      toastNutritionReviewError(err, 'Không thể lưu chỉ số dinh dưỡng');
    },
  });
}

/**
 * "AI tính lại" — hệ thống chịu chi phí, không trừ quota
 * POST /api/v1/admin/content-review/:id/nutrition/recalculate
 */
export function useRecalculateReviewNutritionMutation(revisionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reviewApi.recalculateNutrition(revisionId),
    onSuccess: (panel) => {
      queryClient.setQueryData(CONTENT_REVIEW_KEYS.nutrition(revisionId), panel);
      toast.success(panel.aiJob?.isActive ? 'Đã gửi AI tính lại' : 'Đã tính lại dinh dưỡng', {
        description: panel.aiJob?.isActive
          ? 'Kết quả sẽ tự cập nhật khi AI chạy xong. Giá trị sửa tay vẫn được giữ.'
          : 'Dữ liệu chuẩn đã đủ nên không cần gọi AI.',
      });
    },
    onError: (err: unknown) => toastNutritionReviewError(err, 'Không thể tính lại dinh dưỡng'),
  });
}

// ==========================================
// 3. Backward Compatibility Hooks
// ==========================================

export function useReviewQueueQuery(params?: ReviewQueueQueryParams) {
  return useAdminContentReviewQueueQuery(params);
}

export function useApprovePostMutation() {
  const decisionMutation = useAdminContentReviewDecisionMutation();
  return {
    ...decisionMutation,
    mutateAsync: ({ postId, reason }: { postId: string; reason: string }) =>
      decisionMutation.mutateAsync({
        revisionId: postId,
        decision: ReviewDecisionEnum.APPROVE,
        reason,
      }),
    mutate: (
      { postId, reason }: { postId: string; reason: string },
      options?: Parameters<typeof decisionMutation.mutate>[1]
    ) =>
      decisionMutation.mutate(
        {
          revisionId: postId,
          decision: ReviewDecisionEnum.APPROVE,
          reason,
        },
        options
      ),
  };
}

export function useRejectPostMutation() {
  const decisionMutation = useAdminContentReviewDecisionMutation();
  return {
    ...decisionMutation,
    mutateAsync: ({ postId, reason }: { postId: string; reason: string }) =>
      decisionMutation.mutateAsync({
        revisionId: postId,
        decision: ReviewDecisionEnum.REJECT,
        reason,
      }),
    mutate: (
      { postId, reason }: { postId: string; reason: string },
      options?: Parameters<typeof decisionMutation.mutate>[1]
    ) =>
      decisionMutation.mutate(
        {
          revisionId: postId,
          decision: ReviewDecisionEnum.REJECT,
          reason,
        },
        options
      ),
  };
}
