export interface Recommendation {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  cookTimeMinutes: number;
  difficulty: string;
  difficultyLabel: string;
  calories: number | null;
  ratingAverage: number;
  ratingCount: number;
  score: number;
  reasonCodes: string[];
  reasonLabels: string[];
}

export interface RecommendationMeta {
  scoringVersion: string;
  personalized: boolean;
  generatedAt: string;
  /** Tóm tắt ràng buộc backend đã áp dụng, ví dụ "Đã lọc: chay trường · 1 dị ứng"; `null` khi không có. */
  constraintsSummary: string | null;
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

