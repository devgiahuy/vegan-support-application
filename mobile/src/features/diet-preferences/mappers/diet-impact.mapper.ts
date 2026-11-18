import { BaseMapper, safeArray, safeBoolean, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type { DietaryAffectedMealDto, DietaryCompatibilityDto, DietaryImpactDto, DietaryProgramReferenceDto, DietaryRepairNutritionDto, DietaryRepairPreviewDto, DietaryRepairResultDto, DietaryRepairShoppingDto } from '../types/diet-impact.dto';
import type { DietaryAffectedMeal, DietaryCompatibility, DietaryCompatibilityStatus, DietaryImpact, DietaryImpactedProgram, DietaryRepairNutrition, DietaryRepairPreview, DietaryRepairResult, DietaryRepairShoppingItem } from '../types/diet-impact.model';

const REASONS: Record<string, string> = {
  ALLERGY: 'Có thành phần gây dị ứng đã khai báo',
  ALLERGEN_SELECTION_UNRESOLVED: 'Dị ứng đã khai báo cần được xác định lại',
  INGREDIENT_EXCLUSION: 'Có nguyên liệu bạn đã chọn kiêng',
  FOOD_GROUP_EXCLUSION: 'Có nhóm thực phẩm bạn đã chọn kiêng',
  INGREDIENT_DIETARY_UNCERTAIN: 'Phân loại thực phẩm chưa được xác minh',
  INGREDIENT_COMPOSITION_UNCERTAIN: 'Thành phần nguyên liệu chưa được xác minh đầy đủ',
  UNRESOLVED_INGREDIENT: 'Có nguyên liệu chưa được xác định',
  SOURCE_UNAVAILABLE: 'Món ăn nguồn không còn khả dụng',
  DIET_PATTERN: 'Chưa đáp ứng bộ lọc thực phẩm',
  TRADITION_RULE: 'Chưa đáp ứng quy tắc thực phẩm',
};
const MEALS: Record<string, string> = { BREAKFAST: 'Bữa sáng', LUNCH: 'Bữa trưa', DINNER: 'Bữa tối', SNACK: 'Bữa phụ' };
export function dietaryDateLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}
function status(value: unknown): DietaryCompatibilityStatus {
  return value === 'COMPATIBLE' || value === 'HISTORICAL' ? value : 'NEEDS_REVIEW';
}
function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = safeNumber(value, Number.NaN);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
function affectedMeal(dto: DietaryAffectedMealDto): DietaryAffectedMeal {
  const date = safeString(dto.date);
  const mealType = safeString(dto.mealType);
  const reasons = safeArray<string>(dto.reasons).filter(Boolean);
  return { itemId: safeString(dto.itemId), date, dateLabel: dietaryDateLabel(date), mealType,
    mealTypeLabel: MEALS[mealType] ?? 'Bữa ăn', name: safeString(dto.name, 'Món ăn'),
    reasons, reasonLabels: reasons.map((reason) => REASONS[reason] ?? 'Cần xem lại theo hồ sơ ăn uống'),
    unverified: safeBoolean(dto.unverified) };
}
function programs(value: DietaryProgramReferenceDto[] | undefined): DietaryImpactedProgram[] {
  return safeArray<DietaryProgramReferenceDto>(value).map((dto) => ({
    id: safeString(dto.id), title: safeString(dto.title, 'Lộ trình'), status: safeString(dto.status),
    expectedVersion: safeNumber(dto.expectedVersion, 0),
  })).filter((item) => item.id.length > 0);
}
function nutrition(dto: DietaryRepairNutritionDto | undefined): DietaryRepairNutrition {
  return { calories: optionalNumber(dto?.calories), proteinGrams: optionalNumber(dto?.proteinGrams),
    fiberGrams: optionalNumber(dto?.fiberGrams), fatGrams: optionalNumber(dto?.fatGrams),
    carbohydrateGrams: optionalNumber(dto?.carbohydrateGrams) };
}
function shopping(value: DietaryRepairShoppingDto[] | undefined): DietaryRepairShoppingItem[] {
  return safeArray<DietaryRepairShoppingDto>(value).map((item) => ({
    ingredientId: safeString(item.ingredientId), canonicalName: safeString(item.canonicalName),
    amount: safeNumber(item.amount), unit: safeString(item.unit), sourceItemCount: safeNumber(item.sourceItemCount),
  })).filter((item) => item.ingredientId.length > 0);
}
export function toDietaryCompatibility(dto: DietaryCompatibilityDto | null | undefined): DietaryCompatibility | null {
  if (!dto) return null;
  return { status: status(dto.status), dietaryRevision: safeNumber(dto.dietaryRevision), assessedFrom: safeString(dto.assessedFrom),
    affectedMealCount: safeNumber(dto.affectedMealCount), items: safeArray<DietaryAffectedMealDto>(dto.items).map(affectedMeal) };
}
export class DietImpactMapper extends BaseMapper<DietaryImpactDto, DietaryImpact> {
  toModel(dto: DietaryImpactDto | null | undefined): DietaryImpact {
    return { dietaryRevision: safeNumber(dto?.dietaryRevision), assessedFrom: safeString(dto?.assessedFrom),
      affectedPlanCount: safeNumber(dto?.affectedPlanCount), affectedMealCount: safeNumber(dto?.affectedMealCount),
      plans: safeArray<NonNullable<DietaryImpactDto['plans']>[number]>(dto?.plans).map((plan) => ({
        planId: safeString(plan.planId), weekStart: safeString(plan.weekStart), weekLabel: dietaryDateLabel(safeString(plan.weekStart)),
        expectedVersion: safeNumber(plan.expectedVersion), status: status(plan.status), canRepair: safeBoolean(plan.canRepair),
        programs: programs(plan.programs), items: safeArray<DietaryAffectedMealDto>(plan.items).map(affectedMeal),
      })).filter((plan) => plan.planId.length > 0) };
  }
  toRepairPreview(dto: DietaryRepairPreviewDto | null | undefined): DietaryRepairPreview {
    return { proposalId: safeString(dto?.proposalId), expiresAt: safeDate(dto?.expiresAt), dietaryRevision: safeNumber(dto?.dietaryRevision),
      plans: safeArray<NonNullable<DietaryRepairPreviewDto['plans']>[number]>(dto?.plans).map((plan) => ({
        planId: safeString(plan.planId), weekStart: safeString(plan.weekStart), weekLabel: dietaryDateLabel(safeString(plan.weekStart)),
        expectedVersion: safeNumber(plan.expectedVersion),
        status: plan.status === 'READY' || plan.status === 'UNCHANGED' || plan.status === 'PROGRAM_REVISION_REQUIRED' ? plan.status : 'NO_CANDIDATES',
        message: safeString(plan.message), programs: programs(plan.programs),
        replacements: safeArray<NonNullable<typeof plan.replacements>[number]>(plan.replacements).map((item) => ({
          itemId: safeString(item.itemId), date: safeString(item.date), dateLabel: dietaryDateLabel(safeString(item.date)),
          mealType: safeString(item.mealType), mealTypeLabel: MEALS[safeString(item.mealType)] ?? 'Bữa ăn',
          beforeName: safeString(item.beforeName), afterName: safeString(item.afterName), recipeId: safeString(item.recipeId),
          servings: safeNumber(item.servings, 1), calories: optionalNumber(item.calories),
        })), beforeNutrition: nutrition(plan.beforeNutrition), afterNutrition: nutrition(plan.afterNutrition),
        shoppingBefore: shopping(plan.shoppingBefore), shoppingAfter: shopping(plan.shoppingAfter),
      })) };
  }
  toRepairResult(dto: DietaryRepairResultDto | null | undefined): DietaryRepairResult {
    return { dietaryRevision: safeNumber(dto?.dietaryRevision),
      results: safeArray<NonNullable<DietaryRepairResultDto['results']>[number]>(dto?.results).map((item) => ({
        planId: safeString(item.planId),
        status: item.status === 'UPDATED' || item.status === 'UNCHANGED' || item.status === 'PROGRAM_REVISION_REQUIRED' ? item.status : 'FAILED',
        message: safeString(item.message), remainingAffectedMeals: safeNumber(item.remainingAffectedMeals),
      })) };
  }
}
export const dietImpactMapper = new DietImpactMapper();
