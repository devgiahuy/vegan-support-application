/**
 * DTO recommendations: behavior events, consent, home.
 * Theo `docs/api/recommendations.md` (sync OpenAPI 2026-09-16).
 * Envelope `{success, data, meta}` dùng trực tiếp — cấm bọc `APIResponse<>` 2 tầng.
 */

/** Metadata event tìm kiếm (thô). */
export interface SearchEventMetadataDto {
  query?: string;
}

/** Metadata event chủ đề chat (thô) — chỉ topic codes allowlist, không chat thô. */
export interface ChatTopicEventMetadataDto {
  topicCodes?: (string | null)[] | null;
  topic_codes?: (string | null)[] | null;
}

/** `POST /behavior-events` — oneOf theo `type`; `type` + `idempotencyKey` bắt buộc. */
export type CreateBehaviorEventRequestDto =
  | { type: string; metadata: SearchEventMetadataDto; idempotencyKey: string; occurredAt?: string }
  | {
      type: string;
      metadata: ChatTopicEventMetadataDto;
      idempotencyKey: string;
      occurredAt?: string;
    }
  | {
      type: string;
      entityId: string;
      metadata?: Record<string, never>;
      idempotencyKey: string;
      occurredAt?: string;
    };

/** `POST /behavior-events` → ghi nhận (kể cả dedupe). */
export interface BehaviorEventResponseDto {
  success?: boolean;
  data?: {
    id?: string;
    type?: string;
    entityId?: string | null;
    occurredAt?: string;
    createdAt?: string;
    deduplicated?: boolean;
  } | null;
  meta?: null;
}

/** `PUT /users/me/personalization` — `enabled` + `consentVersion` đều bắt buộc. */
export interface UpdatePersonalizationRequestDto {
  enabled: boolean;
  consentVersion: string;
}

/** Consent thô. */
export interface PersonalizationDto {
  enabled?: boolean;
  consentVersion?: string;
  consent_version?: string;
  consentedAt?: string | null;
  consented_at?: string | null;
  disabledAt?: string | null;
  disabled_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
}

/** `GET/PUT /users/me/personalization` → consent hiện tại. */
export interface PersonalizationResponseDto {
  success?: boolean;
  data?: PersonalizationDto | null;
  meta?: null;
}

/** Món gợi ý thô. */
export interface RecommendationItemDto {
  id?: string;
  slug?: string;
  title?: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  cover_image_url?: string | null;
  cookTimeMinutes?: number | string | null;
  cook_time_minutes?: number | string | null;
  difficulty?: string;
  calories?: number | string | null;
  ratingAverage?: number | string | null;
  rating_average?: number | string | null;
  ratingCount?: number | string;
  rating_count?: number | string;
  voteCount?: number | string;
  vote_count?: number | string;
  bookmarkCount?: number | string;
  bookmark_count?: number | string;
  score?: number | string;
  reasonCodes?: (string | null)[] | null;
  reason_codes?: (string | null)[] | null;
}

/** Meta chấm điểm + ràng buộc đã áp dụng (thô). */
export interface RecommendationMetaDto {
  scoringVersion?: string;
  scoring_version?: string;
  personalized?: boolean;
  lookbackDays?: number | string;
  decayHalfLifeDays?: number | string;
  generatedAt?: string;
  generated_at?: string;
  appliedConstraints?: {
    authenticated?: boolean;
    dietPattern?: string | null;
    allergyCount?: number | string;
    ingredientExclusionCount?: number | string;
    traditions?: (string | null)[] | null;
    forDate?: string | null;
  } | null;
}

/** `GET /recommendations/home` → mảng món + meta. */
export interface RecommendationResponseDto {
  success?: boolean;
  data?: (RecommendationItemDto | null)[] | null;
  meta?: RecommendationMetaDto | null;
}
