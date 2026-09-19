import type {
  AiFeatureListResponseDto,
  AiFlagListResponseDto,
  AiMetricsResponseDto,
  AiRequestListResponseDto,
  ToggleFeatureResponseDto,
} from '../types/ai-governance.dto';

/** Fixture AI governance (phase scaffold — BE còn `PLANNED`, 0 nội dung thô). */
export const aiMetricsFixture: AiMetricsResponseDto = {
  success: true,
  data: [
    {
      date: '2026-09-17',
      feature: 'chat',
      requests: 120,
      errorCount: 3,
      errorRate: 0.025,
      fallbackCount: 1,
      fallbackRate: 0.008,
      avgLatencyMs: 1400,
    },
    {
      date: '2026-09-17',
      feature: 'meal-plan',
      requests: 45,
      errorCount: 0,
      errorRate: 0,
      fallbackCount: 0,
      fallbackRate: 0,
      avgLatencyMs: 900,
    },
    {
      date: '2026-09-16',
      feature: 'chat',
      requests: 98,
      errorCount: 5,
      errorRate: 0.051,
      fallbackCount: 2,
      fallbackRate: 0.02,
      avgLatencyMs: 1600,
    },
  ],
  meta: null,
};

export const aiRequestsFixture: AiRequestListResponseDto = {
  success: true,
  data: [
    {
      id: 'req-1',
      promptHash: 'a1b2c3d4e5f60718293a4b5c6',
      topicCodes: ['PROTEIN', 'B12'],
      provider: 'openai',
      modelId: 'gpt-5.6-terra',
      latencyMs: 1350,
      tokens: 420,
      status: 'OK',
      createdAt: '2026-09-17T10:00:00.000Z',
    },
    {
      id: 'req-2',
      promptHash: 'ff00112233445566778899aabb',
      topicCodes: [],
      provider: 'openai',
      modelId: 'gpt-5.6-terra',
      latencyMs: null,
      tokens: null,
      status: 'FALLBACK',
      createdAt: '2026-09-17T09:00:00.000Z',
    },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

export const aiFlagsFixture: AiFlagListResponseDto = {
  success: true,
  data: [
    {
      id: 'flag-1',
      kind: 'QUOTA_SPIKE',
      target: 'chat',
      status: 'OPEN',
      createdAt: '2026-09-17T08:00:00.000Z',
    },
    {
      id: 'flag-2',
      kind: 'FALLBACK_RATE',
      target: 'meal-plan',
      status: 'REVIEWED',
      createdAt: '2026-09-16T08:00:00.000Z',
    },
  ],
  meta: null,
};

export const aiFeaturesFixture: AiFeatureListResponseDto = {
  success: true,
  data: [
    {
      feature: 'chat',
      enabled: true,
      provider: 'openai',
      modelId: 'gpt-5.6-terra',
      updatedBy: 'Admin Demo',
      updatedAt: '2026-09-17T08:00:00.000Z',
      updateReason: 'Ổn định sau bảo trì.',
    },
    {
      feature: 'meal-plan',
      enabled: false,
      provider: 'openai',
      modelId: 'gpt-5.6-terra',
      updatedBy: 'Admin Demo',
      updatedAt: '2026-09-16T08:00:00.000Z',
      updateReason: 'Tạm tắt khi provider quá tải.',
    },
  ],
  meta: null,
};

export function toggledFeatureFixture(
  feature: string,
  enabled: boolean,
  reason: string
): ToggleFeatureResponseDto {
  return {
    success: true,
    data: {
      feature,
      enabled,
      provider: 'openai',
      modelId: 'gpt-5.6-terra',
      updatedBy: 'Admin Demo',
      updatedAt: new Date().toISOString(),
      updateReason: reason,
    },
    meta: null,
  };
}
