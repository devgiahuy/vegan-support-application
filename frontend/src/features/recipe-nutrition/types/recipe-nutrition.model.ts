export type NutritionOriginType =
  'CANONICAL_CALCULATED' | 'AI_ESTIMATED' | 'USER_PROVIDED' | 'VERIFIED_OVERRIDE';

export interface NutrientItemModel {
  code: string;
  name: string;
  unit: string;
  amount: number;
  formattedAmount: string;
  origin: NutritionOriginType;
  isAiEstimated: boolean;
  confidencePercent: number;
  rangeDisplay: string | null;
}

export interface MacroDistributionModel {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  proteinCaloriesPercent: number;
  carbsCaloriesPercent: number;
  fatCaloriesPercent: number;
}

export interface UncoveredIngredientModel {
  position: number;
  displayName: string;
  reason: string;
}

export interface RecipeNutritionEstimateModel {
  id: string | null;
  revisionId: string;
  postId: string;
  postVersion: number;
  estimateVersion: number;
  status: 'CURRENT' | 'HISTORICAL' | 'STALE';
  isStale: boolean;
  servings: number;
  totalRawGrams: number;
  totalCookedGrams: number;
  confidenceScore: number;
  hasUncoveredIngredients: boolean;
  uncoveredIngredients: UncoveredIngredientModel[];
  macros: MacroDistributionModel;
  perServingNutrients: NutrientItemModel[];
  totalNutrients: NutrientItemModel[];
  aiAssisted: boolean;
  aiProviderDown: boolean;
  disclaimerText: string;
  formattedCreatedAt: string;
}

export interface RecipeNutritionStatusModel {
  postId: string;
  revisionId: string;
  isStale: boolean;
  currentStatus: 'CURRENT' | 'HISTORICAL' | 'STALE' | 'NONE';
  hasCurrentEstimate: boolean;
  aiJobInProgress: boolean;
  aiJobFailed: boolean;
}

export interface RecipeNutritionHistoryItemModel {
  estimateVersion: number;
  createdAt: string;
  formattedDate: string;
  servings: number;
  caloriesPerServing: number;
  confidenceScore: number;
  isStale: boolean;
  aiAssisted: boolean;
}
