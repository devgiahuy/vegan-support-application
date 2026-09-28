/**
 * Food Data UI Models sạch cho UI Components.
 * Theo `specs/008-food-data/data-model.md`.
 */

export type FoodDataQuality = 'UNVERIFIED' | 'COMMUNITY' | 'REVIEWED' | 'LAB_CERTIFIED';
export type FoodDataReviewStatus = 'STAGED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
export type UnitDimension = 'MASS' | 'ENERGY' | 'VOLUME' | 'COUNT' | 'INTERNATIONAL_UNIT';
export type NutrientReferenceType = 'RDA' | 'AI' | 'UL';
export type GuidelinePeriod = 'DAY' | 'WEEK' | 'MONTH';
export type EvidenceGrade = 'STRONG' | 'MODERATE' | 'PRELIMINARY' | 'INSUFFICIENT';
export type FoodRuleSeverity = 'WARNING' | 'NOTICE' | 'COMPATIBLE';
export type InteractionScope = 'SAME_DISH' | 'SAME_MEAL' | 'SAME_DAY';
export type InteractionDirection = 'BIDIRECTIONAL' | 'A_AFFECTS_B' | 'B_AFFECTS_A';

export type FoodDataRecordKind =
  | 'SOURCE'
  | 'NUTRIENT'
  | 'INGREDIENT_PROFILE'
  | 'HOUSEHOLD_CONVERSION'
  | 'NUTRIENT_VALUE'
  | 'REFERENCE_INTAKE'
  | 'INGREDIENT_GUIDELINE'
  | 'COOKING_METHOD'
  | 'RETENTION_FACTOR'
  | 'YIELD_FACTOR'
  | 'INTERACTION_RULE'
  | 'AI_SUGGESTION';

export interface ProvenanceInfo {
  sourceId: string;
  sourceCode: string;
  sourceName: string;
  provider: string;
  sourceRecordId: string;
  sourceVersion: string;
  sourceUrl: string | null;
  licenseName: string;
  licenseUrl: string | null;
  attribution: string;
  effectiveFrom: string;
  locale: string;
}

export interface HouseholdConversion {
  id: string;
  unitName: string;
  unitSymbol: string | null;
  quantity: number;
  unitDimension: 'COUNT' | 'VOLUME' | string;
  grams: number;
}

export interface NutrientItem {
  id: string;
  code: string;
  name: string;
  amount: number | null;
  unit: string;
  unitDimension: UnitDimension | string;
  minValue: number | null;
  maxValue: number | null;
  isMissing: boolean;
  dailyValuePercent?: number | null;
}

export interface IngredientNutritionFact {
  ingredientId: string;
  canonicalName: string;
  normalizedName: string;
  foodGroup: string;
  preparation: string;
  ediblePortionPercent: number;
  servingGrams: number | null;
  quality: FoodDataQuality;
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

export interface IngredientGuidelineItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  populationCode: string;
  amount: number;
  unit: string;
  frequency: number;
  period: GuidelinePeriod;
  periodLabel: string;
  advisoryOnly: boolean;
  evidenceGrade: EvidenceGrade;
  severity: FoodRuleSeverity;
  severityLabel: string;
  explanation: string;
  sourceName: string;
}

export interface RetentionFactorItem {
  nutrientCode: string;
  nutrientName: string;
  factor: number;
  retentionPercent: number;
}

export interface YieldFactorItem {
  ingredientId: string | null;
  factor: number;
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

export interface AdminRecordItem {
  id: string;
  kind: FoodDataRecordKind;
  displayName: string;
  codeOrId: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'STAGED' | 'SUPERSEDED' | string;
  effectiveFrom: string;
  updatedAt: string;
  rawDetails: Record<string, unknown>;
}

export interface FoodDataImportPreviewResult {
  importId: string;
  status: 'PREVIEWED' | 'COMMITTED';
  idempotentReplay: boolean;
  summary: {
    totalRecords: number;
    validRecords: number;
    errorCount: number;
    newIngredientsCount: number;
    mappedNutrientsCount: number;
    committedIngredients?: number;
    committedNutrientValues?: number;
    errors?: Array<{ line?: number; message?: string; path?: string[] }>;
  };
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

export const RECORD_KIND_LABELS: Record<FoodDataRecordKind, string> = {
  SOURCE: 'Nguồn dữ liệu',
  NUTRIENT: 'Định nghĩa dưỡng chất',
  INGREDIENT_PROFILE: 'Hồ sơ dinh dưỡng',
  HOUSEHOLD_CONVERSION: 'Đơn vị gia dụng',
  NUTRIENT_VALUE: 'Giá trị dinh dưỡng',
  REFERENCE_INTAKE: 'Nhu cầu khuyến nghị',
  INGREDIENT_GUIDELINE: 'Hướng dẫn an toàn',
  COOKING_METHOD: 'Phương pháp nấu',
  RETENTION_FACTOR: 'Hệ số giữ dưỡng chất',
  YIELD_FACTOR: 'Hệ số hao hụt khối lượng',
  INTERACTION_RULE: 'Quy tắc tương kỵ',
  AI_SUGGESTION: 'Gợi ý từ AI',
};
