export type MealAnalysisStatus = 'CURRENT' | 'STALE';
export type MealWarningSeverity = 'INFO' | 'CAUTION' | 'HIGH';
export type MealWarningScope = 'DISH' | 'MEAL' | 'DAILY';

export interface MealAnalysisSummary {
  warningCount: number;
  highCount: number;
  cautionCount: number;
  infoCount: number;
  selectedItemCount: number;
}

export interface MealAnalysisWarning {
  id: string;
  code: string;
  title: string;
  severity: MealWarningSeverity;
  severityLabel: string;
  scope: MealWarningScope;
  scopeLabel: string;
  targetDate: string;
  mealType: string | null;
  evidenceGrade: string;
  evidenceSource: string;
  confidence: number;
  measuredValue: number | null;
  limitValue: number | null;
  unit: string | null;
  explanation: string;
  suggestedAdjustment: string | null;
  affectedItemNames: string[];
  affectedIngredients: string[];
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
