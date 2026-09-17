import {
  BaseMapper,
  pickField,
  safeArray,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type {
  CreateBehaviorEventRequestDto,
  PersonalizationDto,
  PersonalizationResponseDto,
  RecommendationItemDto,
  RecommendationMetaDto,
  RecommendationResponseDto,
  UpdatePersonalizationRequestDto,
} from '../types/recommendation.dto';
import type {
  BehaviorEventInput,
  PersonalizationConsent,
  Recommendation,
  RecommendationMeta,
} from '../types/recommendation.model';
import { BehaviorEventType } from '@/common/enums';

const REASON_LABELS: Record<string, string> = {
  INGREDIENT_PREFERENCE: 'Hợp khẩu vị của bạn',
  BOOKMARK_SIMILAR: 'Tương tự món bạn đã lưu',
  RATING_SIMILAR: 'Tương tự món bạn đánh giá cao',
  CHAT_TOPIC: 'Theo chủ đề bạn quan tâm',
  RECENT_SEARCH: 'Liên quan tìm kiếm gần đây',
  REPEATED_VIEW: 'Bạn xem lại nhiều lần',
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

const ENTITY_EVENT_TYPES: BehaviorEventType[] = [
  BehaviorEventType.VIEW_RECIPE,
  BehaviorEventType.BOOKMARK,
  BehaviorEventType.RATE,
  BehaviorEventType.ACCEPT_MEAL,
  BehaviorEventType.SWAP_MEAL,
  BehaviorEventType.REJECT_MEAL,
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * RecommendationMapper: home items + meta/constraints, consent,
 * và builders payload event đúng shape từng loại (sai → null, không gửi).
 * Envelope `{success, data, meta}` đọc trực tiếp.
 */
export class RecommendationMapper extends BaseMapper<RecommendationItemDto, Recommendation> {
  toModel(dto: RecommendationItemDto | null | undefined): Recommendation {
    const difficulty = safeString(pickField(dto, ['difficulty'], 'MEDIUM')).toUpperCase();
    const reasonCodes = safeArray<string | null, string>(
      pickField(dto, ['reasonCodes', 'reason_codes'], null),
      (code) => safeString(code)
    ).filter((code) => code.length > 0);
    const shown = reasonCodes.slice(0, 2);
    return {
      id: safeString(pickField(dto, ['id'], '')),
      slug: safeString(pickField(dto, ['slug'], '')),
      title: safeString(pickField(dto, ['title'], ''), 'Món chay'),
      excerpt: safeString(pickField(dto, ['excerpt'], '')),
      coverImageUrl: safeString(pickField(dto, ['coverImageUrl', 'cover_image_url'], '')) || null,
      cookTimeMinutes: safeNumber(pickField(dto, ['cookTimeMinutes', 'cook_time_minutes'], 0)),
      difficulty,
      difficultyLabel: DIFFICULTY_LABELS[difficulty] ?? difficulty,
      calories: (() => {
        const raw = pickField(dto, ['calories'], null) as unknown;
        if (raw === null || raw === undefined || raw === '') return null;
        const parsed = safeNumber(raw, NaN);
        return Number.isNaN(parsed) ? null : parsed;
      })(),
      ratingAverage: safeNumber(pickField(dto, ['ratingAverage', 'rating_average'], 0)),
      ratingCount: safeNumber(pickField(dto, ['ratingCount', 'rating_count'], 0)),
      voteCount: safeNumber(pickField(dto, ['voteCount', 'vote_count'], 0)),
      bookmarkCount: safeNumber(pickField(dto, ['bookmarkCount', 'bookmark_count'], 0)),
      reasonCodes: shown,
      reasonLabels: shown.map((code) => REASON_LABELS[code] ?? code),
    };
  }

  /** `GET /recommendations/home` — mảng món (meta đọc riêng). */
  toHomeList(dto: RecommendationResponseDto | null | undefined): Recommendation[] {
    const rawItems = pickField(dto, ['data'], null) as (RecommendationItemDto | null)[] | null;
    return this.toModelList(
      safeArray<RecommendationItemDto | null, RecommendationItemDto | null>(
        rawItems,
        (item) => item
      )
    ).filter((item) => item.id.length > 0);
  }

  /** Meta chấm điểm + ràng buộc đã áp dụng. */
  toHomeMeta(dto: RecommendationResponseDto | null | undefined): RecommendationMeta {
    const meta = pickField(dto, ['meta'], null) as RecommendationMetaDto | null;
    const personalized = pickField<boolean>(meta, ['personalized'], false);
    const constraints = pickField(meta, ['appliedConstraints'], null) as
      RecommendationMetaDto['appliedConstraints'] | null;
    const parts: string[] = [];
    if (constraints && typeof constraints === 'object') {
      const diet = safeString(
        pickField(constraints, ['dietPattern', 'diet_pattern'], '')
      ).toUpperCase();
      if (diet) parts.push(DIET_PATTERN_LABELS[diet] ?? diet);
      const allergies = safeNumber(pickField(constraints, ['allergyCount', 'allergy_count'], 0));
      if (allergies > 0) parts.push(`${allergies} dị ứng`);
      const exclusions = safeNumber(
        pickField(constraints, ['ingredientExclusionCount', 'ingredient_exclusion_count'], 0)
      );
      if (exclusions > 0) parts.push(`${exclusions} loại trừ`);
    }
    return {
      scoringVersion: safeString(pickField(meta, ['scoringVersion', 'scoring_version'], '')),
      personalized,
      constraintsSummary: parts.length > 0 ? `Đã lọc: ${parts.join(' · ')}` : null,
    };
  }

  /** `GET/PUT /users/me/personalization` → consent. */
  toConsentModel(dto: PersonalizationResponseDto | null | undefined): PersonalizationConsent {
    const data = pickField(dto, ['data'], null) as PersonalizationDto | null;
    return {
      enabled: pickField<boolean>(data, ['enabled'], false),
      consentVersion: safeString(pickField(data, ['consentVersion', 'consent_version'], '')),
      consentedAt: safeDate(pickField(data, ['consentedAt', 'consented_at'], null)),
      disabledAt: safeDate(pickField(data, ['disabledAt', 'disabled_at'], null)),
      updatedAt: safeDate(pickField(data, ['updatedAt', 'updated_at'], null)),
    };
  }

  toConsentDto(enabled: boolean, consentVersion: string): UpdatePersonalizationRequestDto {
    return { enabled, consentVersion };
  }

  /**
   * Builder payload event đúng shape từng loại.
   * Trả null khi thiếu/sai (caller không gửi + warn dev).
   */
  toEventDto(input: BehaviorEventInput): CreateBehaviorEventRequestDto | null {
    const type = safeEnum(input.type, BehaviorEventType, null as unknown as BehaviorEventType);
    if (!type) return null;
    const base = { type, idempotencyKey: input.idempotencyKey, occurredAt: input.occurredAt };

    if (type === BehaviorEventType.SEARCH) {
      const query = safeString(input.query);
      if (!query) return null;
      return { ...base, metadata: { query } };
    }
    if (type === BehaviorEventType.CHAT_TOPIC) {
      const codes = Array.isArray(input.topicCodes)
        ? input.topicCodes.filter((c): c is string => typeof c === 'string' && c.length > 0)
        : [];
      if (codes.length === 0) return null;
      return { ...base, metadata: { topicCodes: codes } };
    }
    if (ENTITY_EVENT_TYPES.includes(type)) {
      const entityId = safeString(input.entityId);
      if (!UUID_RE.test(entityId)) return null;
      return { ...base, entityId, metadata: {} };
    }
    return null;
  }
}

export const recommendationMapper = new RecommendationMapper();
