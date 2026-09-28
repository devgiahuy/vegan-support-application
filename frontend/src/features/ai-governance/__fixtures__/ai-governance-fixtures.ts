import type {
  AiGovernanceControlResponseDto,
  AiGovernanceControlsResponseDto,
  AiGovernanceFlagsResponseDto,
  AiGovernanceHealthResponseDto,
  AiGovernanceMetricsResponseDto,
  AiGovernanceRequestsResponseDto,
} from '../types/ai-governance.dto';

/** Fixture AI governance — dùng cho unit test offline */
export const aiHealthFixture: AiGovernanceHealthResponseDto = {
  success: true,
  data: {
    evaluatedAt: '2026-09-27T10:00:00.000Z',
    last24Hours: {
      total: 1250,
      failures: 12,
      fallback: 4,
      providerUnavailable: 0,
    },
    controls: [
      {
        capability: 'CHAT',
        provider: 'gemini',
        modelId: 'gemini-1.5-flash',
        enabled: true,
        version: 3,
        fallback: 'HEURISTIC_RULESET',
        updatedAt: '2026-09-26T14:00:00.000Z',
      },
    ],
    retentionDays: 90,
  },
};

export const aiMetricsFixture: AiGovernanceMetricsResponseDto = {
  success: true,
  data: {
    window: { from: '2026-09-20', to: '2026-09-27' },
    requests: [
      {
        capability: 'CHAT',
        provider: 'gemini',
        total: 850,
        failures: 8,
        fallback: 2,
        avgLatencyMs: 420,
      },
      {
        capability: 'VISION',
        provider: 'gemini',
        total: 240,
        failures: 3,
        fallback: 1,
        avgLatencyMs: 850,
      },
    ],
    feedback: { positive: 450, negative: 20 },
    moderation: { open: 2, dismissed: 5, actioned: 8, falsePositiveSignals: 1 },
    recognition: { total: 150, corrected: 15, correctionRate: 0.1 },
    receipts: { total: 90, corrected: 9, correctionRate: 0.1 },
    nutrition: { coverage: 0.95, confidence: 0.92 },
    verification: { total: 50, approved: 45, rejected: 5, revoked: 0 },
    providerUnavailable: 0,
  },
};

export const aiRequestsFixture: AiGovernanceRequestsResponseDto = {
  success: true,
  data: [
    {
      id: 'req-1',
      capability: 'CHAT',
      provider: 'gemini',
      modelId: 'gemini-1.5-flash',
      templateVersion: 'v1.2',
      correlationId: 'corr-001',
      status: 'OK',
      errorClass: null,
      safetyOutcome: 'SAFE',
      latencyMs: 420,
      inputTokens: 180,
      outputTokens: 310,
      costMicros: '1200',
      confidence: 0.95,
      coverage: 1.0,
      startedAt: '2026-09-27T09:30:00.000Z',
      completedAt: '2026-09-27T09:30:00.420Z',
      redacted: true,
    },
    {
      id: 'req-2',
      capability: 'VISION',
      provider: 'gemini',
      modelId: 'gemini-1.5-flash',
      templateVersion: 'v1.0',
      correlationId: 'corr-002',
      status: 'FALLBACK',
      errorClass: 'LATENCY_EXCEEDED',
      safetyOutcome: 'SAFE',
      latencyMs: 1200,
      inputTokens: 800,
      outputTokens: 200,
      costMicros: '2400',
      confidence: 0.7,
      coverage: 0.8,
      startedAt: '2026-09-27T09:15:00.000Z',
      completedAt: '2026-09-27T09:15:01.200Z',
      redacted: true,
    },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

export const aiFlagsFixture: AiGovernanceFlagsResponseDto = {
  success: true,
  data: [
    {
      id: 'flag-1',
      provider: 'gemini-moderation',
      model: 'text-moderation-001',
      riskLevel: 'MEDIUM',
      riskScore: 0.65,
      status: 'OPEN',
      createdAt: '2026-09-27T08:00:00.000Z',
      reviewedAt: null,
    },
  ],
  meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

export const aiFeaturesFixture: AiGovernanceControlsResponseDto = {
  success: true,
  data: [
    {
      capability: 'CHAT',
      provider: 'gemini',
      modelId: 'gemini-1.5-flash',
      enabled: true,
      version: 3,
      fallback: 'HEURISTIC_RULESET',
      updatedAt: '2026-09-26T14:00:00.000Z',
    },
    {
      capability: 'VISION',
      provider: 'gemini',
      modelId: 'gemini-1.5-flash',
      enabled: false,
      version: 1,
      fallback: 'DISABLED',
      updatedAt: '2026-09-25T11:00:00.000Z',
    },
  ],
};

export function toggledFeatureFixture(
  capability: string,
  enabled: boolean,
  version: number
): AiGovernanceControlResponseDto {
  return {
    success: true,
    data: {
      capability,
      provider: 'gemini',
      modelId: 'gemini-1.5-flash',
      enabled,
      version,
      fallback: 'HEURISTIC_RULESET',
      updatedAt: new Date().toISOString(),
    },
  };
}
