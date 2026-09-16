import type { BasePostDto, MediaInputDto } from '@/features/post/types/post.dto';

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

export interface TraditionWarningDto {
  tradition?: string;
  warningCode?: string;
  label?: string;
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

export interface RecipeDetailDto extends BasePostDto {
  recipe?: {
    servings?: number;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    difficulty?: string;
    nutrition?: NutritionFactDto | null;
    mealPlannerEligible?: boolean;
    allergenCodes?: string[];
    traditionWarnings?: TraditionWarningDto[];
    dietCompatibilities?: DietCompatibilityDto[];
    ingredients?: RecipeIngredientDto[];
  } | null;
}

export interface RecipeListResponseDto {
  success: boolean;
  data: RecipeDetailDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RecipeDetailResponseDto {
  success: boolean;
  data: RecipeDetailDto;
  meta?: null;
}

export interface CreateRecipeIngredientInput {
  ingredientId?: string | null;
  displayName: string;
  amount: number;
  unit: string;
  optional?: boolean;
}

export interface CreateRecipeRequestDto {
  type: 'RECIPE';
  title: string;
  slug?: string;
  excerpt?: string;
  categoryIds: string[];
  tags?: string[];
  media: MediaInputDto[];
  body: string;
  recipe: {
    servings: number;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    difficulty: string;
    nutrition?: {
      calories?: number;
      proteinGrams?: number;
      carbsGrams?: number;
      fatGrams?: number;
      fiberGrams?: number;
      vitaminB12Mcg?: number;
    };
    ingredients: CreateRecipeIngredientInput[];
  };
}

export interface UpdateRecipeRequestDto extends Partial<CreateRecipeRequestDto> {
  expectedVersion: number;
}
