/**
 * Food Data DTOs phản chiếu API Backend Phase 12.
 * Theo `docs/api/food-data.md` và `docs/api/food-data-admin.md`.
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
  active?: boolean;
}

export interface NutrientDto {
  id?: string;
  code?: string;
  name?: string;
  defaultUnit?: string;
  default_unit?: string;
  unitDimension?: string;
  unit_dimension?: string;
  description?: string | null;
  active?: boolean;
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
  quality?: string;
  reviewStatus?: string;
}

export interface IngredientNutrientValueDto {
  id?: string;
  profileId?: string;
  nutrientId?: string;
  valuePer100g?: string | number;
  value_per_100g?: string | number;
  unit?: string;
  minValue?: string | number | null;
  min_value?: string | number | null;
  maxValue?: string | number | null;
  max_value?: string | number | null;
  quality?: string;
  reviewStatus?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  nutrient?: NutrientDto | null;
}

export interface IngredientFoodProfileDto {
  id?: string;
  ingredientId?: string;
  ingredient_id?: string;
  preparation?: string;
  ediblePortionPercent?: string | number;
  edible_portion_percent?: string | number;
  servingGrams?: string | number | null;
  serving_grams?: string | number | null;
  quality?: string;
  effectiveFrom?: string;
  effective_from?: string;
  effectiveTo?: string | null;
  effective_to?: string | null;
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

export interface IngredientAliasDto {
  id?: string;
  alias?: string;
  name?: string;
  locale?: string;
}

export interface IngredientNutrientsDataDto {
  id?: string;
  canonicalName?: string;
  canonical_name?: string;
  normalizedName?: string;
  normalized_name?: string;
  foodGroup?: string;
  food_group?: string;
  aliases?: (IngredientAliasDto | null)[] | null;
  foodProfiles?: (IngredientFoodProfileDto | null)[] | null;
  food_profiles?: (IngredientFoodProfileDto | null)[] | null;
}

export interface NutrientReferenceIntakeDto {
  id?: string;
  nutrientId?: string;
  nutrient_id?: string;
  referenceType?: string;
  reference_type?: string;
  populationCode?: string;
  population_code?: string;
  applicability?: Record<string, unknown> | null;
  value?: string | number;
  unit?: string;
  warningEligible?: boolean;
  warning_eligible?: boolean;
  effectiveFrom?: string;
  effective_from?: string;
  nutrient?: NutrientDto | null;
  source?: FoodDataSourceDto | null;
}

export interface IngredientIntakeGuidelineDto {
  id?: string;
  ingredientId?: string;
  ingredient_id?: string;
  populationCode?: string;
  population_code?: string;
  applicability?: Record<string, unknown> | null;
  amount?: string | number;
  unit?: string;
  frequency?: string | number;
  period?: string;
  advisoryOnly?: boolean;
  advisory_only?: boolean;
  evidenceGrade?: string;
  evidence_grade?: string;
  severity?: string;
  explanation?: string;
  effectiveFrom?: string;
  effective_from?: string;
  ingredient?: {
    id?: string;
    canonicalName?: string;
    canonical_name?: string;
  } | null;
  source?: FoodDataSourceDto | null;
}

export interface RetentionFactorDto {
  factor?: string | number;
  applicability?: Record<string, unknown> | null;
  quality?: string;
  nutrient?: NutrientDto | null;
}

export interface YieldFactorDto {
  factor?: string | number;
  ingredientId?: string | null;
  ingredient_id?: string | null;
  applicability?: Record<string, unknown> | null;
  quality?: string;
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
  applicability?: Record<string, unknown> | null;
  explanation?: string;
  suggestedAction?: string | null;
  suggested_action?: string | null;
  hardRule?: boolean;
  hard_rule?: boolean;
  effectiveFrom?: string;
  effective_from?: string;
  ingredientA?: {
    id?: string;
    canonicalName?: string;
    canonical_name?: string;
  } | null;
  ingredient_a?: {
    id?: string;
    canonicalName?: string;
    canonical_name?: string;
  } | null;
  ingredientB?: {
    id?: string;
    canonicalName?: string;
    canonical_name?: string;
  } | null;
  ingredient_b?: {
    id?: string;
    canonicalName?: string;
    canonical_name?: string;
  } | null;
  source?: FoodDataSourceDto | null;
}

export interface AdminFoodDataRecordDto {
  id?: string;
  kind?: string;
  code?: string;
  name?: string;
  canonicalName?: string;
  canonical_name?: string;
  status?: string;
  effectiveFrom?: string;
  effective_from?: string;
  effectiveTo?: string | null;
  effective_to?: string | null;
  reviewStatus?: string;
  review_status?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  data?: Record<string, unknown> | null;
}

export interface CreateFoodDataRecordRequestDto {
  kind: string;
  data: Record<string, unknown>;
}

export interface ReplaceFoodDataRecordRequestDto {
  kind: string;
  data: Record<string, unknown>;
}

export interface ImportNutrientValueItemDto {
  nutrientCode: string;
  valuePer100g: string | number;
  unit: string;
  minValue?: string | number | null;
  maxValue?: string | number | null;
}

export interface ImportConversionItemDto {
  unitName: string;
  unitSymbol?: string | null;
  quantity: string | number;
  unitDimension: string;
  grams: string | number;
}

export interface ImportAliasItemDto {
  name: string;
  locale?: string;
}

export interface ImportRecordItemDto {
  sourceRecordId: string;
  canonicalName: string;
  foodGroup: string;
  preparation?: string;
  locale?: string;
  ediblePortionPercent: string | number;
  servingGrams?: string | number | null;
  quality?: string;
  aliases?: ImportAliasItemDto[];
  householdConversions?: ImportConversionItemDto[];
  nutrients?: ImportNutrientValueItemDto[];
}

export interface PreviewFoodDataImportRequestDto {
  sourceCode: string;
  idempotencyKey: string;
  sourceVersion: string;
  sourceDate?: string | null;
  effectiveFrom: string;
  records: ImportRecordItemDto[];
}

export interface CommitFoodDataImportRequestDto {
  importId: string;
}

export interface FoodDataImportSummaryDto {
  totalRecords?: number;
  validRecords?: number;
  errorCount?: number;
  newIngredientsCount?: number;
  mappedNutrientsCount?: number;
  committedIngredients?: number;
  committedNutrientValues?: number;
  errors?: Array<{ line?: number; message?: string; path?: string[] }>;
}

export interface FoodDataImportResultDto {
  importId?: string;
  status?: 'PREVIEWED' | 'COMMITTED' | string;
  idempotentReplay?: boolean;
  idempotent_replay?: boolean;
  summary?: FoodDataImportSummaryDto | null;
}

export interface FoodDataImportResponseDto {
  success?: boolean;
  data?: FoodDataImportResultDto | null;
  meta?: null;
}
