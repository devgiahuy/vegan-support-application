export type MealAnalysisStatus = 'CURRENT' | 'STALE';
export type MealWarningSeverity = 'INFO' | 'CAUTION' | 'HIGH';
export type MealWarningScope = 'DISH' | 'MEAL' | 'DAILY';

export interface MealAnalysisSummary {
  warningCount: number;
  highCount: number;
  cautionCount: number;
  infoCount: number;
  selectedItemCount: number;
  /** Tóm tắt do backend soạn sẵn (mức nghiêm trọng đã cân nhắc) — ưu tiên hiển thị. */
  statusTitle: string;
  statusDetail: string;
  hardConstraintViolationCount: number;
}

export interface MealWarningAffectedItem {
  itemId: string;
  name: string;
  date: string;
  mealTypeLabel: string;
  servings: number | null;
}

export interface MealAnalysisWarning {
  id: string;
  code: string;
  title: string;
  /** Diễn giải thêm do backend soạn; rỗng khi không có. */
  detail: string;
  severity: MealWarningSeverity;
  severityLabel: string;
  scope: MealWarningScope;
  scopeLabel: string;
  targetDate: string;
  mealType: string | null;
  /** `ABOVE`/`BELOW` so với mục tiêu ước tính; null khi không áp dụng. */
  targetComparison: 'ABOVE' | 'BELOW' | null;
  evidenceGrade: string;
  evidenceGradeLabel: string;
  evidenceSource: string;
  evidenceSourceVersion: string;
  confidence: number;
  measuredValue: number | null;
  limitValue: number | null;
  unit: string | null;
  explanation: string;
  suggestedAdjustment: string | null;
  affectedItems: MealWarningAffectedItem[];
  affectedItemNames: string[];
  affectedIngredients: string[];
  incompleteDataNotes: string[];
}

export interface MealAnalysis {
  id: string;
  mealPlanId: string;
  version: number;
  status: MealAnalysisStatus;
  isStale: boolean;
  algorithmVersion: string;
  planVersion: number;
  analyzedItemIds: string[];
  warnings: MealAnalysisWarning[];
  summary: MealAnalysisSummary;
  confidence: number;
  confidencePercent: number;
  incompleteData: string[];
  ruleVersions: string[];
  disclaimer: string;
  createdAt: Date | null;
  formattedCreatedAt: string;
}
