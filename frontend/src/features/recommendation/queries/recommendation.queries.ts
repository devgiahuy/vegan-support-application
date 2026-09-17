import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiErrorCode, toastApiError } from '@/lib/api-error';
import { recommendationApi } from '../api/recommendation.api';

export const RECOMMENDATION_KEYS = {
  all: ['recommendations'] as const,
  home: () => [...RECOMMENDATION_KEYS.all, 'home'] as const,
  consent: () => [...RECOMMENDATION_KEYS.all, 'consent'] as const,
};

/** Khối gợi ý trang chủ — chỉ member (guest không bắn request vô ích). */
export function useHomeRecommendationsQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: RECOMMENDATION_KEYS.home(),
    queryFn: () => recommendationApi.getHome({ limit: 8 }),
    staleTime: 2 * 60 * 1000,
    enabled: isAuthenticated,
  });
}

/** Consent cá nhân hóa — cache 5 phút cho hook event đọc. */
export function usePersonalizationConsentQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: RECOMMENDATION_KEYS.consent(),
    queryFn: () => recommendationApi.getConsent(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });
}

/** Bật/tắt cá nhân hóa (gửi lại `consentVersion` từ GET). */
export function useSetPersonalizationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { enabled: boolean; consentVersion: string }) =>
      recommendationApi.setConsent(vars.enabled, vars.consentVersion),
    onSuccess: (consent) => {
      queryClient.invalidateQueries({ queryKey: RECOMMENDATION_KEYS.all });
      toast.success(consent.enabled ? 'Đã bật gợi ý cá nhân hóa.' : 'Đã tắt gợi ý cá nhân hóa.');
    },
    onError: (err: unknown) => {
      if (getApiErrorCode(err) === 'PERSONALIZATION_CONSENT_VERSION_UNSUPPORTED') {
        queryClient.invalidateQueries({ queryKey: RECOMMENDATION_KEYS.consent() });
        toast.error('Phiên bản điều khoản đã cũ', {
          description: 'Vui lòng tải lại và xác nhận phiên bản mới nhất.',
        });
        return;
      }
      toastApiError(err, 'Không thể lưu cài đặt');
    },
  });
}
