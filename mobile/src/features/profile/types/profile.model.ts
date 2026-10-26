import type { User } from '@/features/auth/types/auth.model';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';
import type { HealthProfile } from './health.model';

export interface AllergySummary {
  allergenCode: string;
  label: string;
  severity: string;
}

/** Dị ứng theo nguyên liệu chuẩn cụ thể (`ingredientAllergies`). */
export interface IngredientAllergySummary {
  ingredientId: string;
  ingredientName: string;
  severity: string;
  /** false khi nguyên liệu đã bị gỡ khỏi danh mục — vẫn là ràng buộc nhưng nên nhắc người dùng xem lại. */
  ingredientActive: boolean;
}

/** Nguyên liệu người dùng kiêng (`ingredientExclusions`). `ingredientId` null = tên tự nhập chưa liên kết danh mục. */
export interface IngredientExclusionSummary {
  ingredientId: string | null;
  ingredientName: string;
  reason: string | null;
}

export interface DietPreferenceSummary {
  dietPattern: DietPattern;
  dietPatternLabel: string;
  practiceSchedule: PracticeSchedule;
  practiceScheduleLabel: string;
  tradition: Tradition;
  traditionLabel: string;
  requiresRuleReview: boolean;
  confirmedAt: Date | null;
  scheduleDates: string[];
  scheduleTimezone: string;
  allergies: AllergySummary[];
  ingredientAllergies: IngredientAllergySummary[];
  ingredientExclusions: IngredientExclusionSummary[];
}

export interface DetailedProfile {
  user: User;
  health: HealthProfile | null;
  diet: DietPreferenceSummary | null;
  memberSince: string;
}
