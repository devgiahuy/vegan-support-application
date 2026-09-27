import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import { recommendationMapper } from '../mappers/recommendation.mapper';
import type { PersonalizationResponseDto, RecommendationResponseDto } from '../types/recommendation.dto';
import type { BehaviorEventInput, PersonalizationConsent, Recommendation, RecommendationMeta } from '../types/recommendation.model';

export const recommendationApi = {
  getHome: async (params?: { limit?: number; forDate?: string }): Promise<{ items: Recommendation[]; meta: RecommendationMeta }> => {
    const res = await api.get<RecommendationResponseDto>(API_ENDPOINTS.RECOMMENDATIONS.HOME, {
      params,
      silent: true,
    });
    return {
      items: recommendationMapper.toHomeList(res.data),
      meta: recommendationMapper.toHomeMeta(res.data),
    };
  },

  getConsent: async (): Promise<PersonalizationConsent> => {
    const res = await api.get<PersonalizationResponseDto>(API_ENDPOINTS.RECOMMENDATIONS.CONSENT, { silent: true });
    return recommendationMapper.toConsentModel(res.data);
  },

  setConsent: async (enabled: boolean, consentVersion: string): Promise<PersonalizationConsent> => {
    const res = await api.put<PersonalizationResponseDto>(
      API_ENDPOINTS.RECOMMENDATIONS.CONSENT,
      recommendationMapper.toConsentDto(enabled, consentVersion)
    );
    return recommendationMapper.toConsentModel(res.data);
  },

  trackEvent: async (input: BehaviorEventInput): Promise<boolean> => {
    const payload = recommendationMapper.toEventDto(input);
    if (!payload) return false;
    try {
      await api.post(API_ENDPOINTS.RECOMMENDATIONS.EVENTS, payload, { silent: true });
      return true;
    } catch {
      return false;
    }
  },
};

