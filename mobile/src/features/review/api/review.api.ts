import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { reviewMapper } from '../mappers/review.mapper';
import type { ReviewHistoryResponseDto } from '../types/review.dto';
import type { ReviewHistory } from '../types/review.model';

export const reviewApi = {
  /** `GET /posts/:id/review-history` — các bản chỉnh sửa, người duyệt, lý do và tín hiệu kiểm duyệt (tác giả/Admin). */
  getHistory: async (postId: string, page = 1, limit = 20): Promise<ReviewHistory> => {
    const res = await api.get<ReviewHistoryResponseDto>(API_ENDPOINTS.POSTS.REVIEW_HISTORY(postId), {
      params: { page, limit },
      silent: true,
    });
    return reviewMapper.toHistory(res.data);
  },
};
