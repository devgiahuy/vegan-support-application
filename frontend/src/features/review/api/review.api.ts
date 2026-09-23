import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { PaginationResult } from '@/types/api';
import { contentReviewMapper } from '../mappers/content-review.mapper';
import type {
  AdminContentReviewDetailResponseDto,
  ContentReviewHistoryResponseDto,
  ReviewQueueListResponseDto,
} from '../types/content-review.dto';
import type {
  AdminContentReviewDetailModel,
  ContentReviewHistoryModel,
  ContentReviewQueueItem,
  ReviewQueueQueryParams,
  SubmitPostInput,
} from '../types/content-review.model';
import { ReviewDecisionEnum } from '../types/content-review.model';

export const reviewApi = {
  // ==========================================
  // 1. Author APIs (Phase 16)
  // ==========================================

  /**
   * Tác giả nộp một bản nháp immutable để Admin kiểm duyệt
   * POST /api/v1/posts/:id/submit
   */
  submitPost: async (
    postId: string,
    input: SubmitPostInput
  ): Promise<void> => {
    await api.post(API_ENDPOINTS.CONTENT_REVIEW.SUBMIT(postId), {
      revisionId: input.revisionId,
      expectedVersion: input.expectedVersion,
    });
  },

  /**
   * Tác giả hoặc Admin xem tiến trình và lịch sử kiểm duyệt của bài viết
   * GET /api/v1/posts/:id/review-history
   */
  getReviewHistory: async (
    postId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ContentReviewHistoryModel> => {
    const res = await api.get<ContentReviewHistoryResponseDto>(
      API_ENDPOINTS.CONTENT_REVIEW.HISTORY(postId),
      {
        params: {
          page: params?.page,
          limit: params?.limit,
        },
      }
    );

    if (res.data?.success && res.data.data) {
      return contentReviewMapper.toHistoryModel(res.data);
    }
    throw new Error('Phản hồi lịch sử kiểm duyệt không đúng định dạng.');
  },

  // ==========================================
  // 2. Admin APIs (Phase 16)
  // ==========================================

  /**
   * Lấy danh sách hàng chờ kiểm duyệt Admin
   * GET /api/v1/admin/content-review
   */
  getAdminQueue: async (
    params?: ReviewQueueQueryParams
  ): Promise<PaginationResult<ContentReviewQueueItem>> => {
    const res = await api.get<ReviewQueueListResponseDto>(
      API_ENDPOINTS.ADMIN_CONTENT_REVIEW.LIST,
      {
        params: {
          page: params?.page,
          limit: params?.limit,
          status: params?.status,
          type: params?.type,
          priority: params?.priority,
        },
        silent: true,
      }
    );

    if (res.data?.success && Array.isArray(res.data.data)) {
      return contentReviewMapper.toQueuePagination(res.data);
    }
    throw new Error('Phản hồi hàng chờ kiểm duyệt không đúng định dạng.');
  },

  /**
   * Admin xem chi tiết bản nháp nộp duyệt, media, video, tín hiệu AI
   * GET /api/v1/admin/content-review/:id
   */
  getAdminDetail: async (
    revisionId: string
  ): Promise<AdminContentReviewDetailModel> => {
    const res = await api.get<AdminContentReviewDetailResponseDto>(
      API_ENDPOINTS.ADMIN_CONTENT_REVIEW.DETAIL(revisionId)
    );

    if (res.data?.success && res.data.data) {
      return contentReviewMapper.toDetailResponse(res.data);
    }
    throw new Error('Không tìm thấy chi tiết bản nháp kiểm duyệt.');
  },

  /**
   * Admin ra quyết định Phê duyệt hoặc Từ chối bản nháp kèm lý do
   * PATCH /api/v1/admin/content-review/:id
   */
  makeDecision: async (
    revisionId: string,
    decision: ReviewDecisionEnum,
    reason: string
  ): Promise<AdminContentReviewDetailModel> => {
    const payload = contentReviewMapper.toDecisionDto(decision, reason);
    const res = await api.patch<AdminContentReviewDetailResponseDto>(
      API_ENDPOINTS.ADMIN_CONTENT_REVIEW.DECISION(revisionId),
      payload
    );

    if (res.data?.success && res.data.data) {
      return contentReviewMapper.toDetailResponse(res.data);
    }
    throw new Error('Không thể ghi nhận quyết định kiểm duyệt.');
  },

  // ==========================================
  // 3. Backward Compatibility Aliases
  // ==========================================

  getReviewQueue: async (
    params?: ReviewQueueQueryParams
  ): Promise<PaginationResult<ContentReviewQueueItem>> => {
    return reviewApi.getAdminQueue(params);
  },

  approvePost: async (revisionId: string, reason: string): Promise<void> => {
    await reviewApi.makeDecision(revisionId, ReviewDecisionEnum.APPROVE, reason);
  },

  rejectPost: async (revisionId: string, reason: string): Promise<void> => {
    await reviewApi.makeDecision(revisionId, ReviewDecisionEnum.REJECT, reason);
  },
};
