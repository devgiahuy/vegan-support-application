import { resolveMediaUrl } from '@/lib/env';
import { BaseMapper, pickField, safeArray, safeBoolean, safeNumber, safeString } from '@/lib/mapper';
import type { CreateBehaviorEventRequestDto, PersonalizationResponseDto, RecommendationDto, RecommendationResponseDto, UpdatePersonalizationRequestDto } from '../types/recommendation.dto';
import type { BehaviorEventInput, PersonalizationConsent, Recommendation, RecommendationMeta } from '../types/recommendation.model';

/** Mã lý do do backend trả (đồng bộ web). Mã lạ hiện nguyên văn để không giấu thông tin. */
const REASON_LABELS: Record<string, string> = {
  INGREDIENT_PREFERENCE: 'Hợp khẩu vị của bạn',
  BOOKMARK_SIMILAR: 'Tương tự món bạn đã lưu',
  RATING_SIMILAR: 'Tương tự món bạn đánh giá cao',
  CHAT_TOPIC: 'Theo chủ đề bạn quan tâm',
  RECENT_SEARCH: 'Liên quan tìm kiếm gần đây',
  REPEATED_VIEW: 'Bạn xem lại nhiều lần',
  POPULAR: 'Được yêu thích',
  RECENT_RECIPE: 'Món mới',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

const DIET_PATTERN_LABELS: Record<string, string> = {
  VEGAN: 'chay trường',
  LACTO_OVO: 'chay sữa trứng',
};

function idempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** "Đã lọc: chay trường · 1 dị ứng · 2 loại trừ" từ ràng buộc backend đã áp dụng; `null` nếu không có gì để nói. */
function summarizeConstraints(
  constraints: NonNullable<RecommendationResponseDto['meta']>['appliedConstraints'] | undefined
): string | null {
  if (!constraints || typeof constraints !== 'object') return null;
  const parts: string[] = [];
  const diet = safeString(constraints.dietPattern, '').toUpperCase();
  if (diet) parts.push(DIET_PATTERN_LABELS[diet] ?? diet);
  const allergies = safeNumber(constraints.allergyCount, 0);
  if (allergies > 0) parts.push(`${allergies} dị ứng`);
  const exclusions = safeNumber(constraints.ingredientExclusionCount, 0);
  if (exclusions > 0) parts.push(`${exclusions} loại trừ`);
  return parts.length > 0 ? `Đã lọc: ${parts.join(' · ')}` : null;
}

export class RecommendationMapper extends BaseMapper<RecommendationDto, Recommendation> {
  toModel(dto: RecommendationDto | null | undefined): Recommendation {
    const calories = pickField<unknown>(dto, ['calories'], null);
    const reasonCodes = safeArray<string, string>(pickField(dto, ['reasonCodes'], []), (code) => safeString(code))
      .filter(Boolean)
      .slice(0, 2);
    const difficulty = safeString(pickField(dto, ['difficulty'], 'MEDIUM')).toUpperCase();
    return {
      id: safeString(pickField(dto, ['id'], '')),
      slug: safeString(pickField(dto, ['slug'], '')),
      title: safeString(pickField(dto, ['title'], 'Món chay gợi ý')),
      excerpt: safeString(pickField(dto, ['excerpt'], '')) || null,
      coverImageUrl: resolveMediaUrl(safeString(pickField(dto, ['coverImageUrl'], ''))) || null,
      cookTimeMinutes: safeNumber(pickField(dto, ['cookTimeMinutes'], 0), 0),
      difficulty,
      difficultyLabel: DIFFICULTY_LABELS[difficulty] ?? difficulty,
      calories: calories === null || calories === undefined || calories === '' ? null : safeNumber(calories, 0),
      ratingAverage: safeNumber(pickField(dto, ['ratingAverage'], 0), 0),
      ratingCount: safeNumber(pickField(dto, ['ratingCount'], 0), 0),
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
      constraintsSummary: summarizeConstraints(meta?.appliedConstraints),
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
