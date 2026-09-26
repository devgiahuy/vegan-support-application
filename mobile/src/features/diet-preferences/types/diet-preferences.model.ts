import type { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';

export interface DietRulePreviewItem {
  id: string;
  code: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
  /** Quy tắc bắt buộc — không cho tắt trên UI (backend luôn ép áp dụng). */
  hardConstraint: boolean;
  source: string;
  version: number;
}

export interface DietRulePreview {
  ruleSetVersion: number;
  selection: { dietPattern: DietPattern; practiceSchedule: PracticeSchedule; tradition: Tradition };
  rules: DietRulePreviewItem[];
}

export interface DraftAllergy {
  allergenCode: string;
  label: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
}

export interface DraftIngredientExclusion {
  ingredientName: string;
  reason?: string;
}
