import { createHash } from 'node:crypto';
import { BehaviorEventType, MediaKind, type BehaviorEvent } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';
import type { ContentRepository, PublishedPostRecord } from '../content/content.repository.js';
import {
  buildAuthenticatedSearchConstraints,
  dateOnlyInSearchTimezone,
} from '../content/search-constraints.js';
import type {
  RecommendationMetric,
  RecommendationRepository,
} from './recommendation.repository.js';
import {
  PERSONALIZATION_CONSENT_VERSION,
  RECOMMENDATION_SCORING_VERSION,
  type CreateBehaviorEventInput,
  type RecommendationQuery,
  type TopicCode,
  type UpdatePersonalizationInput,
} from './recommendation.schemas.js';

const LOOKBACK_DAYS = 30;
const DECAY_HALF_LIFE_DAYS = 14;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1_000;
const CANDIDATE_POOL_SIZE = 200;

const TOPIC_TERMS: Record<TopicCode, string[]> = {
  TOFU: ['dau hu', 'tofu'],
  MUSHROOM: ['nam', 'mushroom'],
  PROTEIN: ['dam', 'protein'],
  QUICK_MEALS: ['nhanh', 'quick'],
  BREAKFAST: ['bua sang', 'breakfast'],
  DINNER: ['bua toi', 'dinner'],
  LOW_CALORIE: ['it calo', 'low calorie'],
  WHOLE_GRAINS: ['ngu coc nguyen hat', 'gao lut', 'whole grain'],
  VEGETABLES: ['rau', 'vegetable'],
};

type EventMetadata = { tokens?: string[]; topicCodes?: TopicCode[]; ratingAverage?: number };
type Signals = {
  categoryIds: Set<string>;
  ingredientIds: Set<string>;
  ingredientNames: Set<string>;
  searchable: string;
};

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function metadataOf(event: BehaviorEvent): EventMetadata {
  return event.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)
    ? event.metadata
    : {};
}

function eventOutput(event: BehaviorEvent, deduplicated: boolean) {
  return {
    id: event.id,
    type: event.type,
    entityId: event.entityId,
    occurredAt: event.occurredAt.toISOString(),
    createdAt: event.createdAt.toISOString(),
    deduplicated,
  };
}

function recipeSignals(post: PublishedPostRecord): Signals {
  const revision = post.publishedRevision;
  if (!revision)
    return {
      categoryIds: new Set(),
      ingredientIds: new Set(),
      ingredientNames: new Set(),
      searchable: '',
    };
  const ingredientNames = revision.ingredients.map((item) => item.normalizedName);
  return {
    categoryIds: new Set(revision.categories.map((item) => item.categoryId)),
    ingredientIds: new Set(
      revision.ingredients.flatMap((item) => (item.ingredientId ? [item.ingredientId] : [])),
    ),
    ingredientNames: new Set(ingredientNames),
    searchable: [
      revision.normalizedTitle,
      revision.normalizedExcerpt,
      ...revision.tags.map((item) => item.normalizedTag),
      ...ingredientNames,
    ]
      .filter(Boolean)
      .join(' '),
  };
}

function intersects(left: Set<string>, right: Set<string>): boolean {
  return [...left].some((value) => right.has(value));
}

function similar(left: Signals, right: Signals): boolean {
  return (
    intersects(left.categoryIds, right.categoryIds) ||
    intersects(left.ingredientIds, right.ingredientIds) ||
    intersects(left.ingredientNames, right.ingredientNames)
  );
}

function decay(event: BehaviorEvent, now: Date): number {
  const ageDays = Math.max(0, now.getTime() - event.occurredAt.getTime()) / 86_400_000;
  return 0.5 ** (ageDays / DECAY_HALF_LIFE_DAYS);
}

export class RecommendationService {
  constructor(
    private readonly repository: RecommendationRepository,
    private readonly contentRepository: ContentRepository,
  ) {}

  async getPreference(userId: string) {
    const preference = await this.repository.getPreference(userId);
    return preference
      ? {
          enabled: preference.enabled,
          consentVersion: preference.consentVersion,
          consentedAt: preference.consentedAt?.toISOString() ?? null,
          disabledAt: preference.disabledAt?.toISOString() ?? null,
          updatedAt: preference.updatedAt.toISOString(),
        }
      : {
          enabled: false,
          consentVersion: PERSONALIZATION_CONSENT_VERSION,
          consentedAt: null,
          disabledAt: null,
          updatedAt: null,
        };
  }

  async updatePreference(userId: string, input: UpdatePersonalizationInput) {
    if (input.consentVersion !== PERSONALIZATION_CONSENT_VERSION) {
      throw new AppError({
        statusCode: 409,
        code: 'PERSONALIZATION_CONSENT_VERSION_UNSUPPORTED',
        message: 'Phiên bản consent không được hỗ trợ',
      });
    }
    await this.repository.setPreference(userId, input.enabled, input.consentVersion, new Date());
    return this.getPreference(userId);
  }

  async deleteHistory(userId: string) {
    return { deletedCount: await this.repository.deleteHistory(userId) };
  }

  async ingest(userId: string, input: CreateBehaviorEventInput) {
    const preference = await this.repository.getPreference(userId);
    if (!preference?.enabled || preference.consentVersion !== PERSONALIZATION_CONSENT_VERSION) {
      throw new AppError({
        statusCode: 403,
        code: 'PERSONALIZATION_CONSENT_REQUIRED',
        message: 'Cần bật personalization consent trước khi ghi nhận hành vi',
      });
    }
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
    const earliest = Date.now() - LOOKBACK_DAYS * 86_400_000;
    if (occurredAt.getTime() < earliest || occurredAt.getTime() > Date.now() + MAX_FUTURE_SKEW_MS) {
      throw new AppError({
        statusCode: 400,
        code: 'BEHAVIOR_EVENT_TIME_INVALID',
        message: 'Thời điểm hành vi phải nằm trong lookback 30 ngày',
      });
    }

    let entityId: string | undefined;
    let metadata: EventMetadata = {};
    if (input.type === BehaviorEventType.SEARCH) {
      const normalized = normalizeVietnameseText(input.metadata.query);
      if (!normalized)
        throw new AppError({
          statusCode: 400,
          code: 'INVALID_SEARCH_QUERY',
          message: 'Từ khóa phải chứa chữ hoặc số',
        });
      metadata = { tokens: [...new Set(normalized.split(' '))].slice(0, 12) };
    } else if (input.type === BehaviorEventType.CHAT_TOPIC) {
      metadata = { topicCodes: [...new Set(input.metadata.topicCodes)] };
    } else {
      entityId = input.entityId;
      if (!(await this.repository.findPublishedRecipe(entityId))) {
        throw new AppError({
          statusCode: 404,
          code: 'BEHAVIOR_EVENT_INVALID_TARGET',
          message: 'Recipe target không tồn tại hoặc không còn published',
        });
      }
      if (
        input.type === BehaviorEventType.BOOKMARK &&
        !(await this.repository.hasBookmark(userId, entityId))
      ) {
        throw new AppError({
          statusCode: 403,
          code: 'BEHAVIOR_EVENT_NOT_OWNED',
          message: 'Bookmark không thuộc người dùng hiện tại',
        });
      }
      if (input.type === BehaviorEventType.RATE) {
        const rating = await this.repository.findRating(userId, entityId);
        if (!rating)
          throw new AppError({
            statusCode: 403,
            code: 'BEHAVIOR_EVENT_NOT_OWNED',
            message: 'Rating không thuộc người dùng hiện tại',
          });
        metadata = { ratingAverage: (rating.taste + rating.difficulty) / 2 };
      }
    }

    const payloadHash = sha256({
      type: input.type,
      entityId: entityId ?? null,
      metadata,
      occurredAt: input.occurredAt ?? null,
    });
    const existing = await this.repository.findEventByIdempotency(userId, input.idempotencyKey);
    if (existing) {
      if (existing.payloadHash !== payloadHash)
        throw new AppError({
          statusCode: 409,
          code: 'BEHAVIOR_IDEMPOTENCY_CONFLICT',
          message: 'Idempotency key đã được dùng cho payload khác',
        });
      return eventOutput(existing, true);
    }
    const dedupeKey = new Set<BehaviorEventType>([
      BehaviorEventType.SEARCH,
      BehaviorEventType.VIEW_RECIPE,
      BehaviorEventType.CHAT_TOPIC,
    ]).has(input.type)
      ? sha256({
          userId,
          type: input.type,
          entityId: entityId ?? null,
          metadata,
          bucket: Math.floor(occurredAt.getTime() / 300_000),
        })
      : undefined;
    if (dedupeKey) {
      const duplicate = await this.repository.findEventByDedupeKey(dedupeKey);
      if (duplicate) return eventOutput(duplicate, true);
    }
    try {
      const created = await this.repository.createEvent({
        userId,
        type: input.type,
        ...(entityId ? { entityId } : {}),
        idempotencyKey: input.idempotencyKey,
        ...(dedupeKey ? { dedupeKey } : {}),
        payloadHash,
        consentVersion: preference.consentVersion,
        metadata,
        occurredAt,
      });
      return eventOutput(created, false);
    } catch (error) {
      if (!this.repository.isUniqueConstraintError(error)) throw error;
      const duplicate =
        (await this.repository.findEventByIdempotency(userId, input.idempotencyKey)) ??
        (dedupeKey ? await this.repository.findEventByDedupeKey(dedupeKey) : null);
      if (duplicate && (duplicate.payloadHash === payloadHash || duplicate.dedupeKey === dedupeKey))
        return eventOutput(duplicate, true);
      throw new AppError({
        statusCode: 409,
        code: 'BEHAVIOR_IDEMPOTENCY_CONFLICT',
        message: 'Idempotency key đã được dùng cho payload khác',
      });
    }
  }

  async recommend(userId: string, query: RecommendationQuery) {
    const now = new Date();
    const forDate = query.forDate ?? dateOnlyInSearchTimezone(now);
    const profile = await this.contentRepository.findSearchProfile(userId);
    const context = buildAuthenticatedSearchConstraints(profile, undefined, forDate);
    const candidates = await this.contentRepository.findRecommendationCandidates(
      context.constraints,
      CANDIDATE_POOL_SIZE,
    );
    const preference = await this.repository.getPreference(userId);
    const events = preference?.enabled
      ? await this.repository.findEventsSince(
          userId,
          new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000),
        )
      : [];
    const sourceIds = [
      ...new Set(events.flatMap((event) => (event.entityId ? [event.entityId] : []))),
    ];
    const sources = await this.contentRepository.findBehaviorSourceRecipes(sourceIds);
    const sourceSignals = new Map(sources.map((post) => [post.id, recipeSignals(post)]));
    const metrics = await this.repository.getMetrics(candidates.map((post) => post.id));
    const personalized = events.length > 0;
    const ranked = candidates.map((post) =>
      this.score(post, metrics.get(post.id)!, events, sourceSignals, now, personalized),
    );
    ranked.sort(
      (a, b) =>
        b.score - a.score ||
        b.ratingAverage - a.ratingAverage ||
        b.ratingCount - a.ratingCount ||
        b.voteCount - a.voteCount ||
        b.bookmarkCount - a.bookmarkCount ||
        b.publishedAt - a.publishedAt ||
        a.id.localeCompare(b.id),
    );
    return {
      data: ranked.slice(0, query.limit).map(({ publishedAt: _publishedAt, ...item }) => item),
      meta: {
        scoringVersion: RECOMMENDATION_SCORING_VERSION,
        personalized,
        lookbackDays: LOOKBACK_DAYS as 30,
        decayHalfLifeDays: DECAY_HALF_LIFE_DAYS as 14,
        generatedAt: now.toISOString(),
        appliedConstraints: context.summary,
      },
    };
  }

  private score(
    post: PublishedPostRecord,
    metric: RecommendationMetric,
    events: BehaviorEvent[],
    sources: Map<string, Signals>,
    now: Date,
    personalized: boolean,
  ) {
    const candidate = recipeSignals(post);
    const contributions = new Map<string, number>();
    const set = (code: string, value: number) => {
      const current = contributions.get(code);
      if (current === undefined || Math.abs(value) > Math.abs(current))
        contributions.set(code, value);
    };
    const viewCounts = new Map<string, number>();
    for (const event of events)
      if (event.type === BehaviorEventType.VIEW_RECIPE && event.entityId)
        viewCounts.set(event.entityId, (viewCounts.get(event.entityId) ?? 0) + 1);
    for (const event of events) {
      const weight = decay(event, now);
      const source = event.entityId ? sources.get(event.entityId) : undefined;
      if (
        source &&
        new Set<BehaviorEventType>([
          BehaviorEventType.BOOKMARK,
          BehaviorEventType.RATE,
          BehaviorEventType.VIEW_RECIPE,
        ]).has(event.type) &&
        (intersects(candidate.ingredientIds, source.ingredientIds) ||
          intersects(candidate.ingredientNames, source.ingredientNames))
      ) {
        if (event.type !== BehaviorEventType.RATE || (metadataOf(event).ratingAverage ?? 0) >= 4)
          set('INGREDIENT_PREFERENCE', 5 * weight);
      }
      if (source && event.type === BehaviorEventType.BOOKMARK && similar(candidate, source))
        set('BOOKMARK_SIMILAR', 4 * weight);
      if (
        source &&
        event.type === BehaviorEventType.RATE &&
        (metadataOf(event).ratingAverage ?? 0) >= 4 &&
        similar(candidate, source)
      )
        set('HIGH_RATING_SIMILAR', 3 * weight);
      if (
        source &&
        event.type === BehaviorEventType.VIEW_RECIPE &&
        (viewCounts.get(event.entityId!) ?? 0) >= 2 &&
        similar(candidate, source)
      )
        set('REPEATED_VIEW', 2 * weight);
      if (
        event.type === BehaviorEventType.CHAT_TOPIC &&
        metadataOf(event).topicCodes?.some((code) =>
          TOPIC_TERMS[code].some((term) => candidate.searchable.includes(term)),
        )
      )
        set('CHAT_TOPIC_MATCH', 2 * weight);
      if (
        event.type === BehaviorEventType.SEARCH &&
        metadataOf(event).tokens?.some((token) => candidate.searchable.includes(token))
      )
        set('RECENT_SEARCH', weight);
      if (event.type === BehaviorEventType.ACCEPT_MEAL && event.entityId === post.id)
        set('RECENT_MEAL', -4 * weight);
      if (
        source &&
        new Set<BehaviorEventType>([
          BehaviorEventType.SWAP_MEAL,
          BehaviorEventType.REJECT_MEAL,
        ]).has(event.type) &&
        similar(candidate, source)
      )
        set('NEGATIVE_SIMILAR', -3 * weight);
    }
    const behavioralScore = [...contributions.values()].reduce((sum, value) => sum + value, 0);
    const coldStartScore =
      metric.ratingAverage * 2 +
      0.5 * Math.log1p(metric.voteCount) +
      0.5 * Math.log1p(metric.bookmarkCount);
    const positiveReasons = [...contributions.entries()]
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([code]) => code);
    const fallback =
      metric.ratingAverage >= 4
        ? 'HIGHLY_RATED'
        : metric.voteCount + metric.bookmarkCount > 0
          ? 'POPULAR'
          : 'RECENT_RECIPE';
    const revision = post.publishedRevision!;
    const detail = revision.recipeDetail!;
    return {
      id: post.id,
      slug: post.slug,
      title: revision.title,
      excerpt: revision.excerpt,
      coverImageUrl:
        revision.media.find((media) => media.kind === MediaKind.COVER_IMAGE)?.secureUrl ?? null,
      cookTimeMinutes: detail.cookTimeMinutes,
      difficulty: detail.difficulty,
      calories: detail.calories,
      ...metric,
      score: Number((personalized ? behavioralScore : coldStartScore).toFixed(4)),
      reasonCodes: (positiveReasons.length ? positiveReasons : [fallback]).slice(0, 2),
      publishedAt: post.publishedAt?.getTime() ?? 0,
    };
  }
}
