import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recommendationApi } from '../api/recommendation.api';
import type { BehaviorEventInput } from '../types/recommendation.model';
import { useAuthStore } from '@/store/useAuthStore';

export const RECOMMENDATION_QUERY_KEYS = {
  all: ['recommendations'] as const,
  home: (params?: { limit?: number; forDate?: string }) => [...RECOMMENDATION_QUERY_KEYS.all, 'home', params ?? {}] as const,
  consent: () => [...RECOMMENDATION_QUERY_KEYS.all, 'consent'] as const,
};

export function useHomeRecommendationsQuery(params?: { limit?: number; forDate?: string }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: RECOMMENDATION_QUERY_KEYS.home(params),
    queryFn: () => recommendationApi.getHome(params),
    enabled: isAuthenticated,
  });
}

export function usePersonalizationConsentQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: RECOMMENDATION_QUERY_KEYS.consent(),
    queryFn: recommendationApi.getConsent,
    enabled: isAuthenticated,
  });
}

export function useSetPersonalizationConsentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enabled, consentVersion }: { enabled: boolean; consentVersion: string }) =>
      recommendationApi.setConsent(enabled, consentVersion),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECOMMENDATION_QUERY_KEYS.all });
    },
  });
}

export function useTrackBehaviorEventMutation() {
  return useMutation({
    mutationFn: (input: BehaviorEventInput) => recommendationApi.trackEvent(input),
  });
}

