import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';

/**
 * Domain Model diet. Nhãn tiếng Việt xử lý trong mapper, không format trong JSX.
 * Dị ứng + kiêng + quy tắc cứng luôn là ràng buộc backend-enforced (frontend chỉ hiển thị).
 */
export interface DietRule {
  ruleDefinitionId: string;
  name: string;
  source: string;
  isDefault: boolean;
  /** Cứng → toggle disabled + nhãn "Luôn bật". */
  isHard: boolean;
  enabled: boolean;
}

export interface DietPreview {
  ruleSetVersion: number;
  selection: {
    dietPattern: DietPattern;
    practiceSchedule: PracticeSchedule;
    tradition: Tradition;
  };
  rules: DietRule[];
}

export interface Allergy {
  allergenCode: string;
  label: string;
  severity: string;
}

export interface IngredientExclusion {
  ingredientId: string | null;
  ingredientName: string;
  reason: string;
}

export interface EffectiveConstraints {
  always: string[];
  scheduledTradition: string | null;
}

export interface DietPreference {
  dietPattern: DietPattern;
  dietPatternLabel: string;
  practiceSchedule: PracticeSchedule;
  practiceScheduleLabel: string;
  tradition: Tradition;
  traditionLabel: string;
  ruleSetVersion: number;
  confirmedAt: Date | null;
  requiresRuleReview: boolean;
  rules: DietRule[];
  schedule: { timezone: string; dates: string[] } | null;
  allergies: Allergy[];
  ingredientExclusions: IngredientExclusion[];
  effectiveConstraints: EffectiveConstraints;
}

export interface DietSchedule {
  practiceSchedule: PracticeSchedule;
  timezone: string;
  /** Mỗi phần tử `YYYY-MM-DD`. */
  dates: string[];
}
