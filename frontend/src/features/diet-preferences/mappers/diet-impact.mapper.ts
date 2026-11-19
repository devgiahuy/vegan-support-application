import { BaseMapper, safeArray, safeString, safeNumber, safeBoolean, safeDate } from '@/lib/mapper';
import type {
  CompatibilityDto,
  DietaryImpactDto,
  ImpactMealDto,
  ProgramReferenceDto,
  RepairApplyResponseDto,
  RepairNutritionDto,
  RepairPreviewResponseDto,
  RepairShoppingDto,
} from '../types/diet-impact.dto';
import type {
  DietaryCompatibility,
  DietaryImpact,
  DietaryImpactItem,
  DietaryProgramReference,
  DietRepairNutrition,
  DietRepairProposal,
  DietRepairResult,
  DietRepairShoppingItem,
} from '../types/diet-impact.model';

const array = <T>(value: T[] | null | undefined): NonNullable<T>[] =>
  safeArray<T>(value).filter((item): item is NonNullable<T> => item != null);

const compatibilityStatus = (value: unknown): DietaryCompatibility['status'] =>
  value === 'COMPATIBLE' || value === 'NEEDS_REVIEW' || value === 'HISTORICAL' ? value : 'UNKNOWN';
const mealLabels: Record<string, string> = {
  BREAKFAST: 'Bữa sáng',
  LUNCH: 'Bữa trưa',
  DINNER: 'Bữa tối',
};
const reasons: Record<string, string> = {
  ALLERGY: 'Có thành phần gây dị ứng đã khai báo',
  INGREDIENT_EXCLUSION: 'Có nguyên liệu bạn kiêng',
  FOOD_GROUP_EXCLUSION: 'Có nhóm thực phẩm bạn chọn kiêng',
  INGREDIENT_DIETARY_UNCERTAIN: 'Chưa xác minh phân loại thực phẩm',
  INGREDIENT_COMPOSITION_UNCERTAIN: 'Chưa xác minh đủ thành phần',
  UNRESOLVED_INGREDIENT: 'Có nguyên liệu chưa xác định',
  SOURCE_UNAVAILABLE: 'Món nguồn không còn khả dụng',
  ALLERGEN_SELECTION_UNRESOLVED: 'Cần chọn lại dị ứng trong danh mục',
};
const dateLabel = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : value;
function meal(data: ImpactMealDto | null | undefined): DietaryImpactItem {
  const codes = safeArray<unknown>(data?.reasons)
    .map((value) => safeString(value))
    .filter(Boolean);
  return {
    itemId: safeString(data?.itemId),
    date: safeString(data?.date),
    dateLabel: dateLabel(safeString(data?.date)),
    mealType: safeString(data?.mealType),
    mealTypeLabel: mealLabels[safeString(data?.mealType)] ?? 'Bữa ăn',
    name: safeString(data?.name, 'Món ăn'),
    reasons: codes,
    reasonLabels: codes.map((code) => reasons[code] ?? 'Cần xem lại yêu cầu ăn uống'),
    unverified: safeBoolean(data?.unverified),
  };
}
function program(data: ProgramReferenceDto): DietaryProgramReference {
  return {
    id: safeString(data.id),
    title: safeString(data.title),
    status: safeString(data.status),
    expectedVersion: safeNumber(data.expectedVersion),
  };
}
function nutrition(data: RepairNutritionDto | undefined): DietRepairNutrition {
  const value = (input: unknown) =>
    typeof input === 'number' && Number.isFinite(input) ? input : null;
  const values = {
    calories: value(data?.calories),
    proteinGrams: value(data?.proteinGrams),
    fiberGrams: value(data?.fiberGrams),
    fatGrams: value(data?.fatGrams),
    carbohydrateGrams: value(data?.carbohydrateGrams),
  };
  const format = (input: number | null) =>
    input === null ? '—' : input.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  return {
    ...values,
    summary:
      format(values.calories) +
      ' kcal · đạm ' +
      format(values.proteinGrams) +
      ' g · xơ ' +
      format(values.fiberGrams) +
      ' g · béo ' +
      format(values.fatGrams) +
      ' g · tinh bột ' +
      format(values.carbohydrateGrams) +
      ' g',
  };
}
function shopping(data: RepairShoppingDto): DietRepairShoppingItem {
  return {
    ingredientId: safeString(data.ingredientId),
    name: safeString(data.canonicalName),
    amount: safeNumber(data.amount),
    unit: safeString(data.unit),
    sourceItemCount: safeNumber(data.sourceItemCount),
  };
}
export class DietImpactMapper extends BaseMapper<DietaryImpactDto, DietaryImpact> {
  compatibility(data: CompatibilityDto | null | undefined): DietaryCompatibility {
    return {
      status: compatibilityStatus(data?.status),
      dietaryRevision: safeNumber(data?.dietaryRevision),
      assessedFrom: safeString(data?.assessedFrom),
      affectedMealCount: safeNumber(data?.affectedMealCount),
      items: array(data?.items).filter(Boolean).map(meal),
    };
  }
  toModel(data: DietaryImpactDto | null | undefined): DietaryImpact {
    return {
      dietaryRevision: safeNumber(data?.dietaryRevision),
      assessedFrom: safeString(data?.assessedFrom),
      affectedPlanCount: safeNumber(data?.affectedPlanCount),
      affectedMealCount: safeNumber(data?.affectedMealCount),
      plans: array(data?.plans)
        .filter(Boolean)
        .map((plan) => ({
          planId: safeString(plan.planId),
          weekStart: safeString(plan.weekStart),
          weekLabel: dateLabel(safeString(plan.weekStart)),
          expectedVersion: safeNumber(plan.expectedVersion),
          status: compatibilityStatus(plan.status),
          canRepair: safeBoolean(plan.canRepair),
          programs: array(plan.programs).filter(Boolean).map(program),
          items: array(plan.items).filter(Boolean).map(meal),
        })),
    };
  }
  impact(data: DietaryImpactDto | null | undefined): DietaryImpact {
    return this.toModel(data);
  }
  proposal(dto: RepairPreviewResponseDto): DietRepairProposal {
    return {
      proposalId: safeString(dto.data?.proposalId),
      expiresAt: safeDate(dto.data?.expiresAt),
      dietaryRevision: safeNumber(dto.data?.dietaryRevision),
      plans: array(dto.data?.plans)
        .filter(Boolean)
        .map((plan) => {
          const status = plan.status;
          const before = array(plan.shoppingBefore).filter(Boolean).map(shopping);
          const after = array(plan.shoppingAfter).filter(Boolean).map(shopping);
          return {
            planId: safeString(plan.planId),
            weekStart: safeString(plan.weekStart),
            weekLabel: dateLabel(safeString(plan.weekStart)),
            expectedVersion: safeNumber(plan.expectedVersion),
            status:
              status === 'READY' ||
              status === 'NO_CANDIDATES' ||
              status === 'PROGRAM_REVISION_REQUIRED' ||
              status === 'UNCHANGED'
                ? status
                : 'UNKNOWN',
            message: safeString(plan.message),
            programs: array(plan.programs).filter(Boolean).map(program),
            replacements: array(plan.replacements)
              .filter(Boolean)
              .map((item) => ({
                itemId: safeString(item.itemId),
                date: safeString(item.date),
                location:
                  dateLabel(safeString(item.date)) +
                  ' · ' +
                  (mealLabels[safeString(item.mealType)] ?? 'Bữa ăn'),
                mealType: safeString(item.mealType),
                beforeName: safeString(item.beforeName),
                afterName: safeString(item.afterName),
                recipeId: safeString(item.recipeId),
                servings: safeNumber(item.servings, 1),
                calories:
                  typeof item.calories === 'number' && Number.isFinite(item.calories)
                    ? item.calories
                    : null,
              })),
            beforeNutrition: nutrition(plan.beforeNutrition),
            afterNutrition: nutrition(plan.afterNutrition),
            shoppingBefore: before,
            shoppingAfter: after,
            shoppingSummary:
              before.length + ' → ' + after.length + ' dòng nguyên liệu; không thay đổi tủ bếp.',
          };
        }),
    };
  }
  result(dto: RepairApplyResponseDto): DietRepairResult {
    return {
      dietaryRevision: safeNumber(dto.data?.dietaryRevision),
      results: array(dto.data?.results)
        .filter(Boolean)
        .map((item) => {
          const status = item.status;
          return {
            planId: safeString(item.planId),
            status:
              status === 'UPDATED' ||
              status === 'UNCHANGED' ||
              status === 'FAILED' ||
              status === 'PROGRAM_REVISION_REQUIRED'
                ? status
                : 'UNKNOWN',
            message: safeString(item.message),
            remainingAffectedMeals: safeNumber(item.remainingAffectedMeals),
          };
        }),
    };
  }
}
export const dietImpactMapper = new DietImpactMapper();
