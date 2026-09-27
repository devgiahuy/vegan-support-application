export type BehaviorEventTypeDto =
  | 'SEARCH'
  | 'VIEW_RECIPE'
  | 'BOOKMARK'
  | 'RATE'
  | 'CHAT_TOPIC'
  | 'ACCEPT_MEAL'
  | 'SWAP_MEAL'
  | 'REJECT_MEAL';

export interface RecommendationDto {
  id?: string;
  slug?: string;
  title?: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  cookTimeMinutes?: number | string;
  difficulty?: string;
  calories?: number | string | null;
  ratingAverage?: number | string;
  ratingCount?: number | string;
  voteCount?: number | string;
  bookmarkCount?: number | string;
  score?: number | string;
  reasonCodes?: string[];
}

export interface RecommendationResponseDto {
  success?: true;
  data?: RecommendationDto[];
  meta?: {
    scoringVersion?: string;
    personalized?: boolean;
    lookbackDays?: number | string;
    decayHalfLifeDays?: number | string;
    generatedAt?: string;
    appliedConstraints?: string[];
  };
}

export interface PersonalizationResponseDto {
  success?: true;
  data?: {
    enabled?: boolean;
    consentVersion?: string;
    consentedAt?: string | null;
    disabledAt?: string | null;
    updatedAt?: string | null;
  };
  meta?: null;
}

export interface UpdatePersonalizationRequestDto {
  enabled: boolean;
  consentVersion: string;
}

export interface CreateBehaviorEventRequestDto {
  type: BehaviorEventTypeDto;
  idempotencyKey: string;
  entityId?: string;
  metadata?: {
    query?: string;
    topicCodes?: string[];
  };
  occurredAt?: string;
}

