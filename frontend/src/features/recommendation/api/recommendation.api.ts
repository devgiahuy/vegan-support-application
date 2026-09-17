import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type {
  BehaviorEventResponseDto,
  PersonalizationResponseDto,
} from '../types/recommendation.dto';
import type {
  BehaviorEventInput,
  PersonalizationConsent,
  Recommendation,
  RecommendationMeta,
} from '../types/recommendation.model';
import { recommendationMapper } from '../mappers/recommendation.mapper';

/**
 * Consumer 4 capability recommendations đã xác minh live.
 * Event là fire-and-forget: `silent` + caller không `await` chặn UI.
 * Envelope `{success, data, meta}` đọc `res.data` trực tiếp.
 */
export const recommendationApi = {
  /** `GET /recommendations/home` — gợi ý đã lọc luật cứng. */
  getHome: async (params?: {
    limit?: number;
    forDate?: string;
  }): Promise<{
    items: Recommendation[];
    meta: RecommendationMeta;
  }> => {
    const res = await api.get(API_ENDPOINTS.RECOMMENDATIONS.HOME, {
      params: { limit: params?.limit, ...(params?.forDate ? { forDate: params.forDate } : {}) },
      silent: true,
    });
    return {
      items: recommendationMapper.toHomeList(res.data),
      meta: recommendationMapper.toHomeMeta(res.data),
    };
  },

  /** `GET /users/me/personalization` — consent hiện tại. */
  getConsent: async (): Promise<PersonalizationConsent> => {
    const res = await api.get<PersonalizationResponseDto>(API_ENDPOINTS.RECOMMENDATIONS.CONSENT, {
      silent: true,
    });
    return recommendationMapper.toConsentModel(res.data);
  },

  /** `PUT /users/me/personalization` — gửi lại `consentVersion` từ GET. */
  setConsent: async (enabled: boolean, consentVersion: string): Promise<PersonalizationConsent> => {
    const res = await api.put<PersonalizationResponseDto>(
      API_ENDPOINTS.RECOMMENDATIONS.CONSENT,
      recommendationMapper.toConsentDto(enabled, consentVersion),
      { showErrorToast: true }
    );
    return recommendationMapper.toConsentModel(res.data);
  },

  /**
   * `POST /behavior-events` — builder sai trả null thì không gửi.
   * Lỗi luôn nuốt (fire-and-forget), trả `false` để caller bỏ qua.
   */
  trackEvent: async (input: BehaviorEventInput): Promise<boolean> => {
    const payload = recommendationMapper.toEventDto(input);
    if (!payload) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[recommendation] Bỏ event sai shape:', input.type);
      }
      return false;
    }
    try {
      await api.post<BehaviorEventResponseDto>(API_ENDPOINTS.RECOMMENDATIONS.EVENTS, payload, {
        silent: true,
      });
      return true;
    } catch {
      return false;
    }
  },
};
