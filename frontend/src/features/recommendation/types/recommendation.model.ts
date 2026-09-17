import type { BehaviorEventType } from '@/common/enums';

/** Món gợi ý dùng cho UI. `score` chỉ sắp xếp nội bộ, không hiển thị số thô. */
export interface Recommendation {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  cookTimeMinutes: number;
  difficulty: string;
  difficultyLabel: string;
  calories: number | null;
  ratingAverage: number;
  ratingCount: number;
  voteCount: number;
  bookmarkCount: number;
  /** Tối đa 2 mã hiển thị. */
  reasonCodes: string[];
  reasonLabels: string[];
}

/** Ngữ cảnh chấm điểm + ràng buộc đã áp dụng. */
export interface RecommendationMeta {
  scoringVersion: string;
  personalized: boolean;
  /** null khi BE không trả (hiển thị gọn phần có). */
  constraintsSummary: string | null;
}

/** Đồng ý cá nhân hóa. */
export interface PersonalizationConsent {
  enabled: boolean;
  /** Gửi lại nguyên văn khi PUT. */
  consentVersion: string;
  consentedAt: Date | null;
  disabledAt: Date | null;
  updatedAt: Date | null;
}

/** Input ghi behavior event (builder ở mapper kiểm tra shape theo loại). */
export interface BehaviorEventInput {
  type: BehaviorEventType;
  /** UUID thật cho entity events; null cho SEARCH/CHAT_TOPIC. */
  entityId?: string | null;
  /** SEARCH: query; CHAT_TOPIC: topic codes allowlist. */
  query?: string;
  topicCodes?: string[];
  /** ISO hiện tại do client sinh. */
  occurredAt: string;
  /** UUID mới mỗi thao tác. */
  idempotencyKey: string;
}
