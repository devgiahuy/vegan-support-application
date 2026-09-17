'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { BehaviorEventType } from '@/common/enums';
import { recommendationApi } from '@/features/recommendation/api/recommendation.api';
import { RECOMMENDATION_KEYS } from '@/features/recommendation/queries/recommendation.queries';
import type { PersonalizationConsent } from '@/features/recommendation/types/recommendation.model';

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `rc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Hook dùng chung ghi behavior event: fire-and-forget, KHÔNG `await`,
 * KHÔNG toast, tự check consent trước khi gửi, dedupe view lặp 60s.
 * Đặt ở `src/hooks/` để mọi feature dùng mà không import lẫn nhau.
 */
export function useTrackBehaviorEvent() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const recentRef = React.useRef(new Map<string, number>());

  return React.useCallback(
    (
      type: BehaviorEventType,
      payload: { entityId?: string | null; query?: string; topicCodes?: string[] } = {}
    ): void => {
      if (!isAuthenticated) return;
      const consent = queryClient.getQueryData<PersonalizationConsent>(
        RECOMMENDATION_KEYS.consent()
      );
      // Chưa có cache consent (query chưa chạy) → bỏ qua, không đoán.
      if (!consent || !consent.enabled) return;

      const now = Date.now();
      if (
        type === BehaviorEventType.VIEW_RECIPE &&
        payload.entityId &&
        now - (recentRef.current.get(payload.entityId) ?? 0) < 60 * 1000
      ) {
        return;
      }
      if (type === BehaviorEventType.VIEW_RECIPE && payload.entityId) {
        recentRef.current.set(payload.entityId, now);
      }

      void recommendationApi.trackEvent({
        type,
        entityId: payload.entityId ?? null,
        query: payload.query,
        topicCodes: payload.topicCodes,
        occurredAt: new Date(now).toISOString(),
        idempotencyKey: newIdempotencyKey(),
      });
    },
    [isAuthenticated, queryClient]
  );
}
