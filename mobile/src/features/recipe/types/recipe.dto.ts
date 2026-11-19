import type { BasePostDto } from '@/features/post/types/post.dto';

export interface RecipeIngredientDto {
  id?: string;
  ingredientId?: string | null;
  canonicalName?: string | null;
  position?: number;
  displayName?: string;
  normalizedName?: string;
  amount?: number | string;
  unit?: string;
  optional?: boolean;
  resolutionStatus?: string;
}

export interface RecipeStepDto {
  id?: string;
  position?: number;
  instruction?: string;
  durationMinutes?: number | null;
  temperatureCelsius?: number | null;
  cookingMethodId?: string | null;
  cookingMethodCode?: string | null;
  cookingMethodName?: string | null;
  affectedIngredientPositions?: number[];
}

export interface DietCompatibilityDto {
  dietPattern?: string;
  compatible?: boolean;
  reasonCodes?: string[];
}

export interface NutritionFactDto {
  calories?: number | string | null;
  proteinGrams?: number | string | null;
  carbsGrams?: number | string | null;
  fatGrams?: number | string | null;
  fiberGrams?: number | string | null;
  vitaminB12Mcg?: number | string | null;
}

export interface RecipeAllergyWarningDto {
  kind?: string | null;
  identifier?: string | null;
  label?: string | null;
  ingredientNames?: (string | null)[] | null;
}

export interface RecipeDetailDto extends BasePostDto {
  recipe?: {
    servings?: number;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    difficulty?: string;
    nutrition?: NutritionFactDto | null;
    /** Số tác giả đã nhập cho revision này (khác `nutrition` đã công bố). */
    authorNutrition?: NutritionFactDto | null;
    mealPlannerEligible?: boolean;
    allergenCodes?: string[];
    /** Cảnh báo dị ứng khớp riêng với hồ sơ người xem hiện tại. */
    allergyWarnings?: (RecipeAllergyWarningDto | null)[] | null;
    dietaryGroups?: string[];
    dietCompatibilities?: DietCompatibilityDto[];
    ingredients?: RecipeIngredientDto[];
    steps?: (RecipeStepDto | null)[];
    eligibility?: {
      eligible?: boolean;
      reasons?: ({ code?: string; ingredientNames?: (string | null)[] | null } | null)[] | null;
    } | null;
  } | null;
}

export interface AppliedConstraintsDto {
  authenticated: boolean;
  dietPattern: string | null;
  allergyCount: number;
  ingredientExclusionCount: number;
  foodGroups: string[];
  dietaryRevision: number | null;
  forDate: string;
}

export interface RecipeListResponseDto {
  success: boolean;
  data: RecipeDetailDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    rankingVersion?: string;
    appliedConstraints?: AppliedConstraintsDto;
  };
}

/** `GET /posts/:idOrSlug` → 1 công thức. */
export interface RecipeDetailResponseDto {
  success: boolean;
  data: RecipeDetailDto;
  meta?: null;
}
