import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { PaginationResult } from '@/types/api';
import { reviewMapper } from '../mappers/review.mapper';
import { shouldFallbackToFixtures } from '@/features/post/utils/api-fallback';
import type { ReviewQueueListResponseDto, ReviewDecisionRequestDto } from '../types/review.dto';
import type { ReviewQueueItem, ReviewQueueQueryParams } from '../types/review.model';

export const reviewApi = {
  /**
   * Lấy danh sách hàng chờ kiểm duyệt (yêu cầu quyền duyệt).
   * Backend `strict`: chỉ gửi đúng 5 param, không fixture (BE đã chạy local).
   */
  getReviewQueue: async (
    params?: ReviewQueueQueryParams
  ): Promise<PaginationResult<ReviewQueueItem>> => {
    try {
      const res = await api.get<ReviewQueueListResponseDto>(API_ENDPOINTS.REVIEW_QUEUE.LIST, {
        params: {
          page: params?.page,
          limit: params?.limit,
          status: params?.status,
          type: params?.type,
          priority: params?.priority,
        },
        silent: true,
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        return reviewMapper.toPaginationFromEnvelope(res.data.data, res.data.meta);
      }
      throw new Error('Phản hồi hàng chờ kiểm duyệt không đúng định dạng.');
    } catch (err) {
      // 403 (không quyền) và lỗi nghiệp vụ khác → ném tiếp để UI xử lý.
      // Lỗi mạng/5xx → vẫn ném (không fixture danh sách kiểm duyệt).
      if (!shouldFallbackToFixtures(err, 'list')) throw err;
      throw err;
    }
  },

  /**
   * Duyệt bài (backend yêu cầu reason 10–2000 ký tự, kể cả khi duyệt).
   */
  approvePost: async (postId: string, reason: string): Promise<void> => {
    const payload: ReviewDecisionRequestDto = reviewMapper.toDecisionDto(reason);
    await api.patch(API_ENDPOINTS.REVIEW_QUEUE.APPROVE(postId), payload);
  },

  /**
   * Từ chối bài kèm lý do để tác giả sửa lại.
   */
  rejectPost: async (postId: string, reason: string): Promise<void> => {
    const payload: ReviewDecisionRequestDto = reviewMapper.toDecisionDto(reason);
    await api.patch(API_ENDPOINTS.REVIEW_QUEUE.REJECT(postId), payload);
  },
};
