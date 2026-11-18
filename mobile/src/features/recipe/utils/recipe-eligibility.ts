import type { RecipeIneligibilityReason } from '../types/recipe.model';

/** Mã lý do BE trả cho món bị loại (`recipe.eligibility.reasons[].code`). */
const REASON_LABELS: Record<string, string> = {
  ALLERGY: 'Chứa chất bạn dị ứng',
  ALLERGEN_SELECTION_UNRESOLVED: 'Dị ứng đã khai báo chưa được xác định rõ',
  DIET_PATTERN: 'Không đúng kiểu ăn của bạn',
  INGREDIENT_COMPOSITION_UNCERTAIN: 'Thành phần nguyên liệu chưa được xác minh',
  INGREDIENT_EXCLUSION: 'Chứa nguyên liệu bạn kiêng',
  FOOD_GROUP_EXCLUSION: 'Chứa nhóm thực phẩm bạn kiêng',
  INGREDIENT_DIETARY_UNCERTAIN: 'Phân loại thực phẩm chưa được xác minh',
  UNRESOLVED_INGREDIENT: 'Có nguyên liệu chưa liên kết với danh mục chuẩn',
};

export function getIneligibilityReasonLabel(code: string): string {
  return REASON_LABELS[code] ?? 'Không phù hợp với hồ sơ của bạn';
}

/** Một dòng gọn: "Chứa nguyên liệu bạn kiêng: Sữa bò, Phô mai". */
export function formatIneligibilityReason(reason: RecipeIneligibilityReason): string {
  return reason.ingredientNames.length > 0
    ? `${reason.label}: ${reason.ingredientNames.join(', ')}`
    : reason.label;
}
