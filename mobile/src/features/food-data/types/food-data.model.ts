/**
 * Food Data UI Models — chỉ phần tra cứu công khai, đồng bộ
 * `frontend/src/features/food-data/types/food-data.model.ts` (bỏ phần [ADMIN]).
 */

export type UnitDimension = 'MASS' | 'ENERGY' | 'VOLUME' | 'COUNT' | 'INTERNATIONAL_UNIT';
export type NutrientReferenceType = 'RDA' | 'AI' | 'UL';
export type EvidenceGrade = 'STRONG' | 'MODERATE' | 'PRELIMINARY' | 'INSUFFICIENT';
export type FoodRuleSeverity = 'WARNING' | 'NOTICE' | 'COMPATIBLE';
export type InteractionScope = 'SAME_DISH' | 'SAME_MEAL' | 'SAME_DAY';
export type InteractionDirection = 'BIDIRECTIONAL' | 'A_AFFECTS_B' | 'B_AFFECTS_A';

export interface ProvenanceInfo {
  sourceName: string;
  provider: string;
  sourceRecordId: string;
  sourceVersion: string;
  sourceUrl: string | null;
  licenseName: string;
  attribution: string;
  effectiveFrom: string;
}

export interface HouseholdConversion {
  id: string;
  unitName: string;
  quantity: number;
  grams: number;
}

export interface NutrientItem {
  id: string;
  code: string;
  name: string;
  amount: number | null;
  unit: string;
  isMissing: boolean;
}

export interface IngredientNutritionFact {
  ingredientId: string;
  canonicalName: string;
  preparation: string;
  ediblePortionPercent: number;
  provenance: ProvenanceInfo;
  householdConversions: HouseholdConversion[];
  energyKcal: number | null;
  macronutrients: NutrientItem[];
  vitamins: NutrientItem[];
  minerals: NutrientItem[];
  otherNutrients: NutrientItem[];
}

export interface ReferenceIntakeItem {
  id: string;
  nutrientCode: string;
  nutrientName: string;
  populationCode: string;
  populationName: string;
  referenceType: NutrientReferenceType;
  value: number;
  unit: string;
  warningEligible: boolean;
  sourceName: string;
}

export interface RetentionFactorItem {
  nutrientCode: string;
  nutrientName: string;
  retentionPercent: number;
}

export interface YieldFactorItem {
  ingredientId: string | null;
  yieldPercent: number;
}

export interface CookingMethodItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  retentionFactors: RetentionFactorItem[];
  yieldFactors: YieldFactorItem[];
}

export interface FoodInteractionRuleItem {
  id: string;
  ingredientA: { id: string; name: string };
  ingredientB: { id: string; name: string };
  scope: InteractionScope;
  scopeLabel: string;
  direction: InteractionDirection;
  severity: FoodRuleSeverity;
  severityLabel: string;
  evidenceGrade: EvidenceGrade;
  explanation: string;
  suggestedAction: string | null;
  isHardRule: boolean;
  sourceName: string;
}

export const SCOPE_LABELS: Record<InteractionScope, string> = {
  SAME_DISH: 'Cùng món',
  SAME_MEAL: 'Cùng bữa',
  SAME_DAY: 'Cùng ngày',
};

export const SEVERITY_LABELS: Record<FoodRuleSeverity, string> = {
  WARNING: 'Cảnh báo',
  NOTICE: 'Lưu ý',
  COMPATIBLE: 'Hợp khẩu vị',
};

export const POPULATION_LABELS: Record<string, string> = {
  GENERAL_ADULT: 'Người trưởng thành chung',
  ADULT_MALE: 'Nam giới trưởng thành',
  ADULT_FEMALE: 'Nữ giới trưởng thành',
  PREGNANT_WOMAN: 'Phụ nữ mang thai',
  ELDERLY: 'Người cao tuổi',
};
