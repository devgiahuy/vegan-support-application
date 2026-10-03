import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { recommendationApi } from '@/features/recommendation/api/recommendation.api';
import { RECOMMENDATION_QUERY_KEYS } from '@/features/recommendation/queries/recommendation.queries';
import type { BehaviorEventInput, PersonalizationConsent } from '@/features/recommendation/types/recommendation.model';
import { useAuthStore } from '@/store/useAuthStore';

const VIEW_DEDUPE_MS = 60 * 1000;
const SEARCH_QUERY_MAX_LENGTH = 120;

/**
 * Ghi behavior event dùng cho gợi ý cá nhân hoá — fire-and-forget, không await, không báo lỗi
 * cho người dùng. Chỉ gửi khi đã đăng nhập VÀ cache consent cho thấy đã bật cá nhân hoá
 * (chưa có cache consent thì bỏ qua, không đoán). Dedupe xem công thức lặp trong 60 giây.
 * Đặt ở `src/hooks/` để mọi màn dùng mà không import chéo giữa các feature (giống web).
 */
export function useTrackBehaviorEvent() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const recentViewsRef = React.useRef(new Map<string, number>());

  return React.useCallback(
    (input: BehaviorEventInput): void => {
      if (!isAuthenticated) return;

      const consent = queryClient.getQueryData<PersonalizationConsent>(RECOMMENDATION_QUERY_KEYS.consent());
      if (!consent || !consent.enabled) return;

      if (input.type === 'VIEW_RECIPE' && input.entityId) {
        const now = Date.now();
        if (now - (recentViewsRef.current.get(input.entityId) ?? 0) < VIEW_DEDUPE_MS) return;
        recentViewsRef.current.set(input.entityId, now);
      }

      const event: BehaviorEventInput =
        input.type === 'SEARCH' && input.query
          ? { ...input, query: input.query.trim().slice(0, SEARCH_QUERY_MAX_LENGTH) }
          : input;

      void recommendationApi.trackEvent(event);
    },
    [isAuthenticated, queryClient]
  );
}
