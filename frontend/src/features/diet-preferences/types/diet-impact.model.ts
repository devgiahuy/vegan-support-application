export interface DietaryImpactItem {
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

export interface DietaryProgramReference {
  id: string;
  title: string;
  status: string;
  expectedVersion: number;
}

export interface DietaryCompatibility {
  status: 'COMPATIBLE' | 'NEEDS_REVIEW' | 'HISTORICAL' | 'UNKNOWN';
  dietaryRevision: number;
  assessedFrom: string;
  affectedMealCount: number;
  items: DietaryImpactItem[];
}

export interface DietaryImpactPlan {
  planId: string;
  weekStart: string;
  weekLabel: string;
  expectedVersion: number;
  status: DietaryCompatibility['status'];
  canRepair: boolean;
  programs: DietaryProgramReference[];
  items: DietaryImpactItem[];
}

export interface DietaryImpact {
  dietaryRevision: number;
  assessedFrom: string;
  affectedPlanCount: number;
  affectedMealCount: number;
  plans: DietaryImpactPlan[];
}

export interface DietRepairNutrition {
  calories: number | null;
  proteinGrams: number | null;
  fiberGrams: number | null;
  fatGrams: number | null;
  carbohydrateGrams: number | null;
  summary: string;
}

export interface DietRepairShoppingItem {
  ingredientId: string;
  name: string;
  amount: number;
  unit: string;
  sourceItemCount: number;
}

export interface DietRepairPlan {
  planId: string;
  weekStart: string;
  weekLabel: string;
  expectedVersion: number;
  status: 'READY' | 'NO_CANDIDATES' | 'PROGRAM_REVISION_REQUIRED' | 'UNCHANGED' | 'UNKNOWN';
  message: string;
  programs: DietaryProgramReference[];
  replacements: Array<{
    itemId: string;
    date: string;
    location: string;
    mealType: string;
    beforeName: string;
    afterName: string;
    recipeId: string;
    servings: number;
    calories: number | null;
  }>;
  beforeNutrition: DietRepairNutrition;
  afterNutrition: DietRepairNutrition;
  shoppingBefore: DietRepairShoppingItem[];
  shoppingAfter: DietRepairShoppingItem[];
  shoppingSummary: string;
}

export interface DietRepairProposal {
  proposalId: string;
  expiresAt: Date | null;
  dietaryRevision: number;
  plans: DietRepairPlan[];
}

export interface DietRepairResult {
  dietaryRevision: number;
  results: Array<{
    planId: string;
    status: 'UPDATED' | 'UNCHANGED' | 'FAILED' | 'PROGRAM_REVISION_REQUIRED' | 'UNKNOWN';
    message: string;
    remainingAffectedMeals: number;
  }>;
}

export interface DietRepairPreviewInput {
  planIds: string[];
  expectedDietaryRevision: number;
}
export interface DietRepairApplyInput {
  proposalId: string;
  idempotencyKey: string;
}
export interface DietProgramRevisionInput {
  id: string;
  expectedVersion: number;
  idempotencyKey: string;
}
