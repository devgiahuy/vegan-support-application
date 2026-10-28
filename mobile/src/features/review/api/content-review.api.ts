import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { contentReviewMapper } from '../mappers/content-review.mapper';
import type { ContentReviewDetailResponseDto, ContentReviewQueueResponseDto } from '../types/content-review.dto';
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
};
