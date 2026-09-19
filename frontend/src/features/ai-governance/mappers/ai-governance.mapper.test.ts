import { describe, expect, it } from 'vitest';
import { aiGovernanceMapper } from './ai-governance.mapper';
import type {
  AiFlagListResponseDto,
  AiMetricsResponseDto,
  AiRequestListResponseDto,
} from '../types/ai-governance.dto';

describe('AiGovernanceMapper metrics', () => {
  it('map chỉ số đủ field + avgLatency null-safe', () => {
    const result = aiGovernanceMapper.toMetricsList({
      success: true,
      data: [
        {
          date: '2026-09-17',
          feature: 'chat',
          requests: '120',
          errorCount: 3,
          errorRate: 0.025,
          fallbackCount: 1,
          fallbackRate: 0.008,
          avgLatencyMs: 1400,
        },
        { date: '2026-09-17', feature: 'meal-plan', requests: 0 },
      ],
      meta: null,
    } as AiMetricsResponseDto);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ requests: 120, errorRate: 0.025, avgLatencyMs: 1400 });
    expect(result[1].avgLatencyMs).toBeNull();
  });

  it('envelope null → mảng rỗng', () => {
    expect(aiGovernanceMapper.toMetricsList(null)).toEqual([]);
  });
});

describe('AiGovernanceMapper redaction', () => {
  it('chỉ đọc field cho phép — nội dung thô bị loại bỏ', () => {
    const log = aiGovernanceMapper.toRequestLog({
      id: 'log-1',
      promptHash: 'abcdef1234567890',
      topicCodes: ['PROTEIN', null, ''],
      provider: 'openai',
      // @ts-expect-error — mô phỏng BE lỡ trả field thô
      prompt: 'Nội dung chat bí mật',
      content: 'rác',
      rawInput: 'rác',
      profile: { allergies: ['x'] },
      messages: ['rác'],
    });
    expect(JSON.stringify(log)).not.toContain('bí mật');
    expect(JSON.stringify(log)).not.toContain('rác');
    expect(JSON.stringify(log)).not.toContain('allergies');
    expect(log.promptHash).toBe('abcdef123456…');
    expect(log.topicCodes).toEqual(['PROTEIN']);
  });

  it('map log đủ field + status label', () => {
    const result = aiGovernanceMapper.toRequestsList({
      success: true,
      data: [
        { id: 'l1', status: 'FALLBACK', latencyMs: '900', tokens: 120 },
        { id: 'l2', status: 'WEIRD', latencyMs: null, tokens: null },
        null,
      ],
      meta: { page: 1, limit: 10, total: 2, total_pages: 1 },
    } as AiRequestListResponseDto);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].statusLabel).toBe('Dự phòng');
    expect(result.items[0].latencyMs).toBe(900);
    expect(result.items[1].statusLabel).toBe('WEIRD');
    expect(result.items[1].tokens).toBeNull();
    expect(result.metadata.totalItems).toBe(2);
  });

  it('envelope null → list rỗng', () => {
    const result = aiGovernanceMapper.toRequestsList(null);
    expect(result.items).toEqual([]);
  });
});

describe('AiGovernanceMapper flags + features', () => {
  it('map cờ + status lạ giữ nguyên', () => {
    const flags = aiGovernanceMapper.toFlagsList({
      success: true,
      data: [
        { id: 'f1', kind: 'QUOTA_SPIKE', target: 'chat', status: 'OPEN' },
        { id: 'f2', kind: 'X', status: 'GHOST' },
        { id: '' },
      ],
      meta: null,
    } as AiFlagListResponseDto);
    expect(flags).toHaveLength(2);
    expect(flags[0].statusLabel).toBe('Đang mở');
    expect(flags[1].statusLabel).toBe('GHOST');
  });

  it('map features + toggle dto', () => {
    const features = aiGovernanceMapper.toFeaturesList({
      success: true,
      data: [
        {
          feature: 'chat',
          enabled: true,
          provider: 'openai',
          modelId: 'gpt-5.6-terra',
          updatedBy: 'Admin',
          updateReason: 'Ổn định',
        },
        { feature: '', enabled: false },
      ],
      meta: null,
    });
    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({ enabled: true, provider: 'openai' });
    expect(aiGovernanceMapper.toToggleDto(false, 'Lỗi')).toEqual({ enabled: false, reason: 'Lỗi' });
  });

  it('toToggledFeature null-safe', () => {
    const toggled = aiGovernanceMapper.toToggledFeature({
      success: true,
      data: { feature: 'chat', enabled: false },
      meta: null,
    });
    expect(toggled.enabled).toBe(false);
    expect(toggled.updateReason).toBeNull();
    expect(aiGovernanceMapper.toToggledFeature(null).feature).toBe('');
  });

  it('snake_case toàn diện', () => {
    const log = aiGovernanceMapper.toRequestLog({
      id: 'l',
      prompt_hash: 'abc',
      model_id: 'm',
      created_at: '2026-09-17T10:00:00.000Z',
    });
    expect(log.promptHash).toBe('abc');
    expect(log.modelId).toBe('m');
    expect(log.createdAt).not.toBeNull();
  });

  it('flags null → rỗng, features null → rỗng', () => {
    expect(aiGovernanceMapper.toFlagsList(null)).toEqual([]);
    expect(aiGovernanceMapper.toFeaturesList(null)).toEqual([]);
  });

  it('hash ngắn giữ nguyên, thiếu → rỗng', () => {
    const short = aiGovernanceMapper.toRequestLog({ id: 'l', promptHash: 'abc' });
    expect(short.promptHash).toBe('abc');
    const missing = aiGovernanceMapper.toRequestLog({ id: 'l' });
    expect(missing.promptHash).toBe('');
    expect(missing.provider).toBe('');
  });

  it('metrics thiếu field → 0, feature lạ giữ nguyên', () => {
    const [item] = aiGovernanceMapper.toMetricsList({
      success: true,
      data: [{ date: 'd', feature: 'X' }],
      meta: null,
    });
    expect(item).toMatchObject({ requests: 0, errorCount: 0, fallbackRate: 0, feature: 'X' });
  });
});
