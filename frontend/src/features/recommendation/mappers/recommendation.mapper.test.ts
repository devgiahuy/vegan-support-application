import { describe, expect, it } from 'vitest';
import { recommendationMapper } from './recommendation.mapper';
import type { RecommendationResponseDto } from '../types/recommendation.dto';
import { BehaviorEventType } from '@/common/enums';

const homeEnvelope: RecommendationResponseDto = {
  success: true,
  data: [
    {
      id: '9271327d-5346-41db-9f4e-429d8bbc616b',
      slug: 'gao-lut-dau-hu',
      title: 'Gạo lứt đậu hũ 600 kcal',
      excerpt: null,
      coverImageUrl: null,
      cookTimeMinutes: 30,
      difficulty: 'EASY',
      calories: 600,
      ratingAverage: 0,
      ratingCount: 0,
      voteCount: 2,
      bookmarkCount: 1,
      score: 8.0743,
      reasonCodes: ['INGREDIENT_PREFERENCE', 'BOOKMARK_SIMILAR', 'EXTRA_CODE', null],
    },
    null,
  ],
  meta: {
    scoringVersion: 'behavioral-v1',
    personalized: true,
    lookbackDays: 30,
    decayHalfLifeDays: 14,
    generatedAt: '2026-09-16T18:34:11.722Z',
    appliedConstraints: {
      authenticated: true,
      dietPattern: 'VEGAN',
      allergyCount: 1,
      ingredientExclusionCount: 1,
      traditions: [],
      forDate: '2026-09-17',
    },
  },
};

describe('RecommendationMapper home', () => {
  it('map món thật: tối đa 2 reasons + label Việt', () => {
    const items = recommendationMapper.toHomeList(homeEnvelope);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Gạo lứt đậu hũ 600 kcal');
    expect(items[0].reasonCodes).toEqual(['INGREDIENT_PREFERENCE', 'BOOKMARK_SIMILAR']);
    expect(items[0].reasonLabels).toEqual(['Hợp khẩu vị của bạn', 'Tương tự món bạn đã lưu']);
    expect(items[0].difficultyLabel).toBe('Dễ');
    expect(items[0].calories).toBe(600);
  });

  it('reason lạ giữ nguyên văn, calories null khi thiếu', () => {
    const items = recommendationMapper.toHomeList({
      success: true,
      data: [{ id: 'x', title: 'Món X', reasonCodes: ['MYSTERY_CODE'], calories: null }],
      meta: null,
    });
    expect(items[0].reasonLabels).toEqual(['MYSTERY_CODE']);
    expect(items[0].calories).toBeNull();
    expect(items[0].coverImageUrl).toBeNull();
  });

  it('envelope null → mảng rỗng', () => {
    expect(recommendationMapper.toHomeList(null)).toEqual([]);
  });

  it('meta constraints gọn tiếng Việt', () => {
    const meta = recommendationMapper.toHomeMeta(homeEnvelope);
    expect(meta.scoringVersion).toBe('behavioral-v1');
    expect(meta.personalized).toBe(true);
    expect(meta.constraintsSummary).toBe('Đã lọc: chay trường · 1 dị ứng · 1 loại trừ');
  });

  it('meta thiếu → summary null', () => {
    const meta = recommendationMapper.toHomeMeta({ success: true, data: [], meta: null });
    expect(meta.constraintsSummary).toBeNull();
    expect(meta.personalized).toBe(false);
  });
});

describe('RecommendationMapper consent', () => {
  it('map consent live + snake_case', () => {
    const consent = recommendationMapper.toConsentModel({
      success: true,
      data: {
        enabled: true,
        consentVersion: 'behavior-personalization-v1',
        consentedAt: '2026-09-16T12:16:52.632Z',
        disabledAt: null,
      },
      meta: null,
    });
    expect(consent.enabled).toBe(true);
    expect(consent.consentVersion).toBe('behavior-personalization-v1');
    expect(consent.disabledAt).toBeNull();
    expect(recommendationMapper.toConsentDto(consent.enabled, consent.consentVersion)).toEqual({
      enabled: true,
      consentVersion: 'behavior-personalization-v1',
    });
  });

  it('consent null → disabled + version rỗng', () => {
    const consent = recommendationMapper.toConsentModel(null);
    expect(consent).toMatchObject({ enabled: false, consentVersion: '' });
  });
});

describe('RecommendationMapper event builders', () => {
  const base = { occurredAt: '2026-09-16T18:34:11.722Z', idempotencyKey: 'key-1' };

  it('SEARCH cần query, rỗng → null', () => {
    expect(
      recommendationMapper.toEventDto({ type: BehaviorEventType.SEARCH, query: 'đậu hũ', ...base })
    ).toEqual({ type: 'SEARCH', metadata: { query: 'đậu hũ' }, ...base });
    expect(
      recommendationMapper.toEventDto({ type: BehaviorEventType.SEARCH, query: '   ', ...base })
    ).toBeNull();
  });

  it('CHAT_TOPIC chỉ codes, rỗng/raw-text → null', () => {
    expect(
      recommendationMapper.toEventDto({
        type: BehaviorEventType.CHAT_TOPIC,
        topicCodes: ['PROTEIN', ''],
        ...base,
      })
    ).toEqual({ type: 'CHAT_TOPIC', metadata: { topicCodes: ['PROTEIN'] }, ...base });
    expect(
      recommendationMapper.toEventDto({
        type: BehaviorEventType.CHAT_TOPIC,
        topicCodes: [],
        ...base,
      })
    ).toBeNull();
  });

  it('entity events cần UUID thật', () => {
    const uuid = '9271327d-5346-41db-9f4e-429d8bbc616b';
    expect(
      recommendationMapper.toEventDto({
        type: BehaviorEventType.VIEW_RECIPE,
        entityId: uuid,
        ...base,
      })
    ).toEqual({ type: 'VIEW_RECIPE', entityId: uuid, metadata: {}, ...base });
    expect(
      recommendationMapper.toEventDto({
        type: BehaviorEventType.BOOKMARK,
        entityId: 'not-uuid',
        ...base,
      })
    ).toBeNull();
    expect(recommendationMapper.toEventDto({ type: BehaviorEventType.RATE, ...base })).toBeNull();
  });

  it('difficulty lạ giữ nguyên mã, excerpt rỗng ẩn', () => {
    const items = recommendationMapper.toHomeList({
      success: true,
      data: [{ id: 'y', title: 'Món Y', difficulty: 'EXPERT', excerpt: '' }],
      meta: null,
    });
    expect(items[0].difficultyLabel).toBe('EXPERT');
    expect(items[0].excerpt).toBe('');
  });

  it('type lạ → null', () => {
    expect(
      recommendationMapper.toEventDto({
        type: 'HACK' as BehaviorEventType,
        entityId: '9271327d-5346-41db-9f4e-429d8bbc616b',
        ...base,
      })
    ).toBeNull();
  });
});
