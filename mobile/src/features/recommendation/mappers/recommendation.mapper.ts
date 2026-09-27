import { BaseMapper, pickField, safeArray, safeBoolean, safeNumber, safeString } from '@/lib/mapper';
import type { CreateBehaviorEventRequestDto, PersonalizationResponseDto, RecommendationDto, RecommendationResponseDto, UpdatePersonalizationRequestDto } from '../types/recommendation.dto';
import type { BehaviorEventInput, PersonalizationConsent, Recommendation, RecommendationMeta } from '../types/recommendation.model';

const REASON_LABELS: Record<string, string> = {
  MATCHES_DIET: 'Hop khau vi',
  POPULAR: 'Duoc yeu thich',
  SIMILAR_TO_SAVED: 'Gan voi mon da luu',
  MEAL_PLAN_FIT: 'Hop thuc don',
  COLD_START: 'Goi y khoi dau',
};

function idempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class RecommendationMapper extends BaseMapper<RecommendationDto, Recommendation> {
  toModel(dto: RecommendationDto | null | undefined): Recommendation {
    const calories = pickField<unknown>(dto, ['calories'], null);
    const reasonCodes = safeArray<string, string>(pickField(dto, ['reasonCodes'], []), (code) => safeString(code)).filter(Boolean);
    return {
      id: safeString(pickField(dto, ['id'], '')),
      slug: safeString(pickField(dto, ['slug'], '')),
      title: safeString(pickField(dto, ['title'], 'Mon chay goi y')),
      excerpt: safeString(pickField(dto, ['excerpt'], '')) || null,
      coverImageUrl: safeString(pickField(dto, ['coverImageUrl'], '')) || null,
      cookTimeMinutes: safeNumber(pickField(dto, ['cookTimeMinutes'], 0), 0),
      difficulty: safeString(pickField(dto, ['difficulty'], 'EASY')),
      calories: calories === null ? null : safeNumber(calories, 0),
      ratingAverage: safeNumber(pickField(dto, ['ratingAverage'], 0), 0),
      score: safeNumber(pickField(dto, ['score'], 0), 0),
      reasonCodes,
      reasonLabels: reasonCodes.map((code) => REASON_LABELS[code] ?? code),
    };
  }

  toHomeList(dto: RecommendationResponseDto | null | undefined): Recommendation[] {
    return this.toModelList(pickField(dto, ['data'], []));
  }

  toHomeMeta(dto: RecommendationResponseDto | null | undefined): RecommendationMeta {
    const meta = dto?.meta;
    return {
      scoringVersion: safeString(meta?.scoringVersion, 'behavioral-v1'),
      personalized: safeBoolean(meta?.personalized, false),
      generatedAt: safeString(meta?.generatedAt, ''),
      appliedConstraints: safeArray<string, string>(meta?.appliedConstraints, (item) => safeString(item)).filter(Boolean),
    };
  }

  toConsentModel(dto: PersonalizationResponseDto | null | undefined): PersonalizationConsent {
    const data = dto?.data;
    return {
      enabled: safeBoolean(data?.enabled, false),
      consentVersion: safeString(data?.consentVersion, 'behavior-personalization-v1'),
      consentedAt: safeString(data?.consentedAt, '') || null,
      disabledAt: safeString(data?.disabledAt, '') || null,
      updatedAt: safeString(data?.updatedAt, '') || null,
    };
  }

  toConsentDto(enabled: boolean, consentVersion: string): UpdatePersonalizationRequestDto {
    return { enabled, consentVersion };
  }

  toEventDto(input: BehaviorEventInput): CreateBehaviorEventRequestDto | null {
    if (input.type === 'SEARCH') {
      const query = safeString(input.query);
      if (!query) return null;
      return { type: 'SEARCH', metadata: { query }, idempotencyKey: idempotencyKey('search') };
    }
    if (input.type === 'CHAT_TOPIC') {
      const topicCodes = input.topicCodes?.map((topic) => topic.trim()).filter(Boolean) ?? [];
      if (topicCodes.length === 0) return null;
      return { type: 'CHAT_TOPIC', metadata: { topicCodes }, idempotencyKey: idempotencyKey('chat') };
    }
    if (!input.entityId) return null;
    return { type: input.type, entityId: input.entityId, idempotencyKey: idempotencyKey(input.type.toLowerCase()) };
  }
}

export const recommendationMapper = new RecommendationMapper();
