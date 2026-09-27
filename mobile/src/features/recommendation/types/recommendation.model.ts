export interface Recommendation {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  cookTimeMinutes: number;
  difficulty: string;
  calories: number | null;
  ratingAverage: number;
  score: number;
  reasonCodes: string[];
  reasonLabels: string[];
}

export interface RecommendationMeta {
  scoringVersion: string;
  personalized: boolean;
  generatedAt: string;
  appliedConstraints: string[];
}

export interface PersonalizationConsent {
  enabled: boolean;
  consentVersion: string;
  consentedAt: string | null;
  disabledAt: string | null;
  updatedAt: string | null;
}

export interface BehaviorEventInput {
  type: 'SEARCH' | 'VIEW_RECIPE' | 'BOOKMARK' | 'CHAT_TOPIC';
  entityId?: string;
  query?: string;
  topicCodes?: string[];
}

