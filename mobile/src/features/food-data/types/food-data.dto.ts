/**
 * Food Data DTOs — chỉ phần tra cứu công khai (dinh dưỡng nguyên liệu, nhu cầu khuyến
 * nghị, phương pháp nấu, quy tắc tương tác). Bỏ phần [ADMIN] vì mobile không có màn
 * quản trị dữ liệu chuẩn. Đồng bộ `frontend/src/features/food-data/types/food-data.dto.ts`.
 */

export interface FoodDataPageMetaDto {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  total_pages?: number;
}

export interface FoodDataListResponseDto<T> {
  success?: boolean;
  data?: (T | null)[] | null;
  meta?: FoodDataPageMetaDto | null;
}

export interface FoodDataRecordResponseDto<T> {
  success?: boolean;
  data?: T | null;
  meta?: null;
}

export interface FoodDataSourceDto {
  id?: string;
  code?: string;
  name?: string;
  provider?: string;
  sourceUrl?: string | null;
  source_url?: string | null;
  licenseName?: string;
  license_name?: string;
  licenseUrl?: string | null;
  license_url?: string | null;
  attribution?: string;
  defaultLocale?: string;
  default_locale?: string;
}

export interface NutrientDto {
  id?: string;
  code?: string;
  name?: string;
  defaultUnit?: string;
  default_unit?: string;
  unitDimension?: string;
  unit_dimension?: string;
}

export interface HouseholdConversionDto {
  id?: string;
  unitName?: string;
  unit_name?: string;
  unitSymbol?: string | null;
  unit_symbol?: string | null;
  quantity?: string | number;
  unitDimension?: string;
  unit_dimension?: string;
  grams?: string | number;
}

export interface IngredientNutrientValueDto {
  id?: string;
  valuePer100g?: string | number;
  value_per_100g?: string | number;
  unit?: string;
  minValue?: string | number | null;
  min_value?: string | number | null;
  maxValue?: string | number | null;
  max_value?: string | number | null;
  nutrient?: NutrientDto | null;
}

export interface IngredientFoodProfileDto {
  id?: string;
  preparation?: string;
  ediblePortionPercent?: string | number;
  edible_portion_percent?: string | number;
  servingGrams?: string | number | null;
  serving_grams?: string | number | null;
  quality?: string;
  effectiveFrom?: string;
  effective_from?: string;
  sourceRecordId?: string;
  source_record_id?: string;
  sourceVersion?: string;
  source_version?: string;
  source?: FoodDataSourceDto | null;
  householdConversions?: (HouseholdConversionDto | null)[] | null;
  household_conversions?: (HouseholdConversionDto | null)[] | null;
  nutrientValues?: (IngredientNutrientValueDto | null)[] | null;
  nutrient_values?: (IngredientNutrientValueDto | null)[] | null;
}

export interface IngredientNutrientsDataDto {
  id?: string;
  canonicalName?: string;
  canonical_name?: string;
  foodGroup?: string;
  food_group?: string;
  foodProfiles?: (IngredientFoodProfileDto | null)[] | null;
  food_profiles?: (IngredientFoodProfileDto | null)[] | null;
}

export interface NutrientReferenceIntakeDto {
  id?: string;
  referenceType?: string;
  reference_type?: string;
  populationCode?: string;
  population_code?: string;
  value?: string | number;
  unit?: string;
  warningEligible?: boolean;
  warning_eligible?: boolean;
  nutrient?: NutrientDto | null;
  source?: FoodDataSourceDto | null;
}

export interface RetentionFactorDto {
  factor?: string | number;
  nutrient?: NutrientDto | null;
}

export interface YieldFactorDto {
  factor?: string | number;
  ingredientId?: string | null;
  ingredient_id?: string | null;
}

export interface CookingMethodDto {
  id?: string;
  code?: string;
  name?: string;
  description?: string | null;
  active?: boolean;
  retentionFactors?: (RetentionFactorDto | null)[] | null;
  retention_factors?: (RetentionFactorDto | null)[] | null;
  yieldFactors?: (YieldFactorDto | null)[] | null;
  yield_factors?: (YieldFactorDto | null)[] | null;
}

export interface IngredientInteractionRuleDto {
  id?: string;
  ingredientAId?: string;
  ingredient_a_id?: string;
  ingredientBId?: string;
  ingredient_b_id?: string;
  scope?: string;
  direction?: string;
  severity?: string;
  evidenceGrade?: string;
  evidence_grade?: string;
  explanation?: string;
  suggestedAction?: string | null;
  suggested_action?: string | null;
  hardRule?: boolean;
  hard_rule?: boolean;
  ingredientA?: { id?: string; canonicalName?: string; canonical_name?: string } | null;
  ingredient_a?: { id?: string; canonicalName?: string; canonical_name?: string } | null;
  ingredientB?: { id?: string; canonicalName?: string; canonical_name?: string } | null;
  ingredient_b?: { id?: string; canonicalName?: string; canonical_name?: string } | null;
  source?: FoodDataSourceDto | null;
}
