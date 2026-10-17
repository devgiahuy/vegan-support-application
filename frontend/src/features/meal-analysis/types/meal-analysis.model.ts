/**
 * Clean UI Models cho tính năng Phân tích Thực đơn Tuần (Phase 18).
 * Toàn bộ trường có kiểu chặt chẽ, camelCase, sẵn sàng cho UI render không cần null-check phức tạp.
 */

export type MealWarningSeverity = 'WARNING' | 'DANGER';
export type MealWarningScope = 'SAME_DISH' | 'SAME_MEAL' | 'SAME_DAY';
export type EvidenceGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'GRADE_D';
export type DishSourceType = 'RECIPE' | 'CUSTOM_MEAL';

export interface AffectedPlanItem {
  planItemId: string;
  dishId: string;
  dishType: DishSourceType;
  dishName: string;
  ingredientId: string | null;
  ingredientName: string | null;
  amount: number | null;
  unit: string | null;
}

export interface SwapSuggestion {
  suggestedDishId: string;
  dishType: DishSourceType;
  dishName: string;
  coverImageUrl: string | null;
  calories: number;
  matchReason: string;
  resolvesWarningCodes: string[];
}

export interface MealWarning {
  id: string;
  code: string;
  title: string;
  detail: string;
  suggestion: string | null;
  severity: MealWarningSeverity;
  severityLabel: string;
  scope: MealWarningScope;
  scopeLabel: string;
  targetDate: string;
  mealType: string | null;
  targetComparison: 'ABOVE' | 'BELOW' | null;
  evidenceGrade: EvidenceGrade;
  evidenceGradeLabel: string;
  evidenceSource: string;
  ruleVersion: string;
  confidence: number;
  measuredValue: number | null;
  limitValue: number | null;
  unit: string | null;
  excessPercent: number | null;
  explanation: string;
  suggestedAdjustment: string | null;
  affectedItems: AffectedPlanItem[];
  suggestedSwaps: SwapSuggestion[];
}

export interface AnalysisSummary {
  totalWarnings: number;
  dangerCount: number;
  warningCount: number;
  userStatus: string;
  title: string;
  detail: string;
  advisoryCount: number;
  hardConstraintViolationCount: number;
  hardConstraintsPreserved: boolean;
  dailyLimitViolations: number;
  compatibilityViolations: number;
  sameDishCount: number;
  sameMealCount: number;
  sameDayCount: number;
}

export interface MacroTargets {
  proteinGrams: number;
  fiberGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
}

export interface DayEstimatedNutrition {
  date: string;
  totals: {
    proteinGrams: number | null;
    fiberGrams: number | null;
    fatGrams: number | null;
    carbohydrateGrams: number | null;
  };
  confidence: number;
  uncertaintyNotes: string[];
}

export interface EstimatedNutritionAnalysis {
  estimated: boolean;
  targetSource: string;
  targetSourceDetail: string;
  tolerancePercent: number;
  targets: MacroTargets;
  days: DayEstimatedNutrition[];
}

export interface MealPlanAnalysis {
  id: string;
  mealPlanId: string;
  planLockVersion: number;
  analysisVersion: number;
  analyzedAt: string;
  formattedAnalyzedAt: string;
  isStale: boolean;
  overallConfidence: number;
  hasIncompleteData: boolean;
  incompleteDataNotes: string | null;
  summary: AnalysisSummary;
  warnings: MealWarning[];
  estimatedNutrition: EstimatedNutritionAnalysis | null;
}
