import { describe, expect, it } from 'vitest';
import { aiGovernanceMapper } from './ai-governance.mapper';
import type {
  AiGovernanceControlAuditResponseDto,
  AiGovernanceFlagsResponseDto,
  AiGovernanceHealthResponseDto,
  AiGovernanceMetricsResponseDto,
  AiGovernanceRequestsResponseDto,
} from '../types/ai-governance.dto';

describe('AiGovernanceMapper health summary', () => {
  it('map đúng dữ liệu tổng quan 24h và retention policy', () => {
    const health = aiGovernanceMapper.toHealthSummary({
      success: true,
      data: {
        evaluatedAt: '2026-09-27T10:00:00.000Z',
        last24Hours: {
          total: 1500,
          failures: 15,
          fallback: 5,
          providerUnavailable: 1,
        },
        controls: [
          { capability: 'CHAT', enabled: true },
          { capability: 'VISION', enabled: false },
        ],
        retentionDays: 90,
      },
    } as AiGovernanceHealthResponseDto);

    expect(health.total24h).toBe(1500);
    expect(health.failures24h).toBe(15);
    expect(health.fallback24h).toBe(5);
    expect(health.providerUnavailable24h).toBe(1);
    expect(health.retentionDays).toBe(90);
    expect(health.activeControlsCount).toBe(2);
    expect(health.evaluatedAt).toBeInstanceOf(Date);
  });

  it('xử lý an toàn khi data null', () => {
    const health = aiGovernanceMapper.toHealthSummary(null);
    expect(health.total24h).toBe(0);
    expect(health.failures24h).toBe(0);
    expect(health.retentionDays).toBe(90);
    expect(health.activeControlsCount).toBe(0);
    expect(health.evaluatedAt).toBeNull();
  });
});

describe('AiGovernanceMapper metrics summary', () => {
  it('tính toán tổng requests, failures, tỷ lệ phản hồi và độ trễ trung bình', () => {
    const metrics = aiGovernanceMapper.toMetricsSummary({
      success: true,
      data: {
        window: { from: '2026-09-01', to: '2026-09-27' },
        requests: [
          {
            capability: 'CHAT',
            provider: 'gemini',
            total: 100,
            failures: 2,
            fallback: 1,
            avgLatencyMs: 300,
          },
          {
            capability: 'VISION',
            provider: 'gemini',
            total: 50,
            failures: 1,
            fallback: 0,
            avgLatencyMs: 700,
          },
        ],
        feedback: { positive: 90, negative: 10 },
        moderation: { open: 2, dismissed: 5, actioned: 3, falsePositiveSignals: 1 },
        recognition: { total: 40, corrected: 4, correctionRate: 0.1 },
        receipts: { total: 20, corrected: 2, correctionRate: 0.1 },
        nutrition: { coverage: 0.95, confidence: 0.88 },
        providerUnavailable: 0,
      },
    } as AiGovernanceMetricsResponseDto);

    expect(metrics.totalRequests).toBe(150);
    expect(metrics.totalFailures).toBe(3);
    expect(metrics.totalFallbacks).toBe(1);
    expect(metrics.avgLatencyMs).toBe(500); // (300 + 700) / 2
    expect(metrics.feedbackSatisfactionRate).toBe(90); // 90 / 100 * 100
    expect(metrics.recognitionCorrectionRate).toBe(10); // 0.1 * 100
    expect(metrics.receiptsCorrectionRate).toBe(10);
    expect(metrics.nutritionConfidence).toBe(88); // 0.88 * 100
    expect(metrics.requestsBreakdown).toHaveLength(2);
    expect(metrics.requestsBreakdown[0].capabilityLabel).toBe('Trợ lý Dinh dưỡng (Chat)');
  });

  it('xử lý khi metrics rỗng hoặc null', () => {
    const metrics = aiGovernanceMapper.toMetricsSummary(null);
    expect(metrics.totalRequests).toBe(0);
    expect(metrics.totalFailures).toBe(0);
    expect(metrics.avgLatencyMs).toBeNull();
    expect(metrics.feedbackSatisfactionRate).toBeNull();
    expect(metrics.recognitionCorrectionRate).toBeNull();
  });
});

describe('AiGovernanceMapper redaction & request logs', () => {
  it('chỉ đọc metadata cho phép — tuyệt đối không đọc trường nội dung thô / PII', () => {
    const log = aiGovernanceMapper.toRequestLog({
      id: 'req-1',
      capability: 'CHAT',
      provider: 'gemini',
      modelId: 'gemini-1.5-flash',
      correlationId: 'corr-123',
      status: 'OK',
      latencyMs: 320,
      inputTokens: 150,
      outputTokens: 250,
      confidence: 0.92,
      coverage: 1.0,
      startedAt: '2026-09-27T08:00:00.000Z',
      completedAt: '2026-09-27T08:00:00.320Z',
      redacted: true,
      // @ts-expect-error — mô phỏng backend lỡ gửi các trường nhạy cảm
      prompt: 'Tôi bị tiểu đường type 2, nên ăn gì?',
      content: 'Bí mật y tế',
      rawInput: 'Dữ liệu thô',
      userHealthProfile: { conditions: ['diabetes'] },
      receiptImage: 'https://example.com/receipt.jpg',
    });

    const serialized = JSON.stringify(log);
    expect(serialized).not.toContain('tiểu đường');
    expect(serialized).not.toContain('Bí mật y tế');
    expect(serialized).not.toContain('Dữ liệu thô');
    expect(serialized).not.toContain('receipt.jpg');
    expect(log.id).toBe('req-1');
    expect(log.capabilityLabel).toBe('Trợ lý Dinh dưỡng (Chat)');
    expect(log.statusLabel).toBe('Thành công');
    expect(log.confidencePercent).toBe(92);
    expect(log.redacted).toBe(true);
  });

  it('map danh sách log phân trang chuẩn', () => {
    const result = aiGovernanceMapper.toRequestsList({
      success: true,
      data: [
        { id: 'r1', capability: 'VISION', status: 'FALLBACK', latencyMs: 650 },
        { id: 'r2', capability: 'RECEIPT', status: 'ERROR', errorClass: 'TIMEOUT' },
        null,
      ],
      meta: { page: 1, limit: 10, total: 2, total_pages: 1 },
    } as AiGovernanceRequestsResponseDto);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].capabilityLabel).toBe('Nhận diện Tủ lạnh (Vision)');
    expect(result.items[0].statusLabel).toBe('Dự phòng');
    expect(result.items[1].capabilityLabel).toBe('Bóc tách Hóa đơn');
    expect(result.items[1].statusLabel).toBe('Lỗi');
    expect(result.metadata.totalItems).toBe(2);
  });

  it('envelope null trả về items rỗng', () => {
    const result = aiGovernanceMapper.toRequestsList(null);
    expect(result.items).toEqual([]);
  });
});

describe('AiGovernanceMapper flags, features & audit', () => {
  it('map danh sách cờ kiểm duyệt an toàn', () => {
    const flags = aiGovernanceMapper.toFlagsList({
      success: true,
      data: [
        {
          id: 'f1',
          provider: 'gemini',
          model: 'text-mod',
          riskLevel: 'HIGH',
          riskScore: 0.85,
          status: 'OPEN',
        },
        {
          id: 'f2',
          provider: 'gemini',
          model: 'text-mod',
          riskLevel: 'LOW',
          riskScore: 0.15,
          status: 'REVIEWED',
        },
        { id: '' },
      ],
    } as AiGovernanceFlagsResponseDto);

    expect(flags).toHaveLength(2);
    expect(flags[0].riskLevelLabel).toBe('Cao');
    expect(flags[0].riskScorePercent).toBe(85);
    expect(flags[0].statusLabel).toBe('Đang mở');
    expect(flags[1].riskLevelLabel).toBe('Thấp');
    expect(flags[1].riskScorePercent).toBe(15);
    expect(flags[1].statusLabel).toBe('Đã xem xét');
  });

  it('map danh sách cấu hình tính năng', () => {
    const features = aiGovernanceMapper.toFeaturesList({
      success: true,
      data: [
        {
          capability: 'CHAT',
          provider: 'gemini',
          modelId: 'gemini-flash',
          enabled: true,
          version: 2,
          fallback: 'HEURISTIC_RULESET',
        },
        {
          capability: 'VISION',
          provider: 'gemini',
          modelId: 'gemini-vision',
          enabled: false,
          version: 1,
          fallback: 'DISABLED',
        },
      ],
    });

    expect(features).toHaveLength(2);
    expect(features[0].capabilityLabel).toBe('Trợ lý Dinh dưỡng (Chat)');
    expect(features[0].fallbackLabel).toBe('Quy tắc Heuristic');
    expect(features[1].capabilityLabel).toBe('Nhận diện Tủ lạnh (Vision)');
    expect(features[1].fallbackLabel).toBe('Tắt tính năng');
  });

  it('map lịch sử kiểm toán bật/tắt tính năng', () => {
    const audit = aiGovernanceMapper.toAuditList({
      success: true,
      data: [
        {
          id: 'aud-1',
          capability: 'CHAT',
          provider: 'gemini',
          enabled: false,
          version: 3,
          actorId: 'admin-1',
          reason: 'PROVIDER_INCIDENT',
          createdAt: '2026-09-27T10:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    } as AiGovernanceControlAuditResponseDto);

    expect(audit.items).toHaveLength(1);
    expect(audit.items[0].reasonLabel).toBe('Sự cố nhà cung cấp');
    expect(audit.items[0].capabilityLabel).toBe('Trợ lý Dinh dưỡng (Chat)');
  });

  it('tạo payload toggle chuẩn', () => {
    const payload = aiGovernanceMapper.toTogglePayload('gemini', false, 2, 'SAFETY_HOLD');
    expect(payload).toEqual({
      provider: 'gemini',
      enabled: false,
      expectedVersion: 2,
      reason: 'SAFETY_HOLD',
    });
  });
});
