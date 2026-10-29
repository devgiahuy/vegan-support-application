import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { contentReviewMapper } from '../mappers/content-review.mapper';
import { reviewNutritionMapper } from '../mappers/review-nutrition.mapper';
import type { ContentReviewDetailResponseDto, ContentReviewQueueResponseDto } from '../types/content-review.dto';
import type { ReviewNutritionPanelResponseDto } from '../types/review-nutrition.dto';
import type { ReviewNutritionOverrideValues, ReviewNutritionPanel } from '../types/review-nutrition.model';
import type {
  ContentReviewDecision,
  ContentReviewDetail,
  ContentReviewQueuePage,
  ContentReviewQueueQuery,
} from '../types/content-review.model';

/** Hàng chờ kiểm duyệt cho Contributor (và Admin): BE tự giới hạn theo quyền, client không lọc quyền. */
export const contentReviewApi = {
  /** `GET /admin/content-review` */
  getQueue: async (query: ContentReviewQueueQuery = {}): Promise<ContentReviewQueuePage> => {
    const res = await api.get<ContentReviewQueueResponseDto>(API_ENDPOINTS.CONTENT_REVIEW.LIST, { params: query, silent: true });
    return contentReviewMapper.toQueuePage(res.data);
  },

  /** `GET /admin/content-review/:revisionId` — nội dung bất biến của bản nộp, media và tín hiệu AI. */
  getDetail: async (revisionId: string): Promise<ContentReviewDetail> => {
    const res = await api.get<ContentReviewDetailResponseDto>(API_ENDPOINTS.CONTENT_REVIEW.DETAIL(revisionId), { silent: true });
    return contentReviewMapper.toDetail(res.data);
  },

  /** `PATCH /admin/content-review/:revisionId` — duyệt/từ chối kèm lý do. */
  decide: async (revisionId: string, decision: ContentReviewDecision, reason: string): Promise<ContentReviewDetail> => {
    const res = await api.patch<ContentReviewDetailResponseDto>(
      API_ENDPOINTS.CONTENT_REVIEW.DETAIL(revisionId),
      contentReviewMapper.toDecisionDto(decision, reason),
      { silent: true }
    );
    return contentReviewMapper.toDetail(res.data);
  },

  /** `GET /admin/content-review/:revisionId/nutrition` — panel dinh dưỡng của bản nộp công thức. */
  getNutritionPanel: async (revisionId: string): Promise<ReviewNutritionPanel> => {
    const res = await api.get<ReviewNutritionPanelResponseDto>(API_ENDPOINTS.CONTENT_REVIEW.NUTRITION(revisionId), { silent: true });
    return reviewNutritionMapper.toResponse(res.data);
  },

  /** `PATCH /admin/content-review/:revisionId/nutrition` — sửa tay / bỏ sửa tay từng chỉ số (có audit). */
  updateNutritionOverrides: async (
    revisionId: string,
    values: ReviewNutritionOverrideValues,
    reason?: string
  ): Promise<ReviewNutritionPanel> => {
    const res = await api.patch<ReviewNutritionPanelResponseDto>(
      API_ENDPOINTS.CONTENT_REVIEW.NUTRITION(revisionId),
      reviewNutritionMapper.toOverrideRequest(values, reason),
      { silent: true }
    );
    return reviewNutritionMapper.toResponse(res.data);
  },

  /** `POST /admin/content-review/:revisionId/nutrition/recalculate` (202) — "AI tính lại", hệ thống chịu chi phí. */
  recalculateNutrition: async (revisionId: string): Promise<ReviewNutritionPanel> => {
    const res = await api.post<ReviewNutritionPanelResponseDto>(
      API_ENDPOINTS.CONTENT_REVIEW.NUTRITION_RECALCULATE(revisionId),
      undefined,
      { silent: true }
    );
    return reviewNutritionMapper.toResponse(res.data);
  },
};
