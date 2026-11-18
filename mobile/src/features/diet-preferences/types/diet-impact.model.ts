export type DietaryCompatibilityStatus = 'COMPATIBLE' | 'NEEDS_REVIEW' | 'HISTORICAL';

export interface DietaryAffectedMeal {
  itemId: string;
  date: string;
  dateLabel: string;
  mealType: string;
  mealTypeLabel: string;
  name: string;
  reasons: string[];
  reasonLabels: string[];
  unverified: boolean;
}

export interface DietaryCompatibility {
  status: DietaryCompatibilityStatus;
  dietaryRevision: number;
  assessedFrom: string;
  affectedMealCount: number;
  items: DietaryAffectedMeal[];
}

export interface DietaryImpactedProgram {
  id: string;
  title: string;
  status: string;
  expectedVersion: number;
}

export interface DietaryImpactedPlan {
  planId: string;
  weekStart: string;
  weekLabel: string;
  expectedVersion: number;
  status: DietaryCompatibilityStatus;
  canRepair: boolean;
  programs: DietaryImpactedProgram[];
  items: DietaryAffectedMeal[];
}

export interface DietaryImpact {
  dietaryRevision: number;
  assessedFrom: string;
  affectedPlanCount: number;
  affectedMealCount: number;
  plans: DietaryImpactedPlan[];
}

export interface DietaryRepairNutrition {
  calories: number | null;
  proteinGrams: number | null;
  fiberGrams: number | null;
  fatGrams: number | null;
  carbohydrateGrams: number | null;
}

export interface DietaryRepairShoppingItem {
  ingredientId: string;
  canonicalName: string;
  amount: number;
  unit: string;
  sourceItemCount: number;
}

export interface DietaryReplacement {
  itemId: string;
  date: string;
  dateLabel: string;
  mealType: string;
  mealTypeLabel: string;
  beforeName: string;
  afterName: string;
  recipeId: string;
  servings: number;
  calories: number | null;
}

export interface DietaryRepairPlan {
  planId: string;
  weekStart: string;
  weekLabel: string;
  expectedVersion: number;
  status: 'READY' | 'NO_CANDIDATES' | 'PROGRAM_REVISION_REQUIRED' | 'UNCHANGED';
  message: string;
  programs: DietaryImpactedProgram[];
  replacements: DietaryReplacement[];
  beforeNutrition: DietaryRepairNutrition;
  afterNutrition: DietaryRepairNutrition;
  shoppingBefore: DietaryRepairShoppingItem[];
  shoppingAfter: DietaryRepairShoppingItem[];
}

export interface DietaryRepairPreview {
  proposalId: string;
  expiresAt: Date | null;
  dietaryRevision: number;
  plans: DietaryRepairPlan[];
}

export interface DietaryRepairResult {
  dietaryRevision: number;
  results: {
    planId: string;
    status: 'UPDATED' | 'UNCHANGED' | 'FAILED' | 'PROGRAM_REVISION_REQUIRED';
    message: string;
    remainingAffectedMeals: number;
  }[];
}
