import type { EstimatedTargets, MealPlan } from '../types/meal-plan.model';

const DEFAULT_CALORIES = 2000;
const FALLBACK_TOLERANCE_PERCENT = 15;
const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Mục tiêu 4 chỉ số mỗi ngày: ưu tiên số do backend ước tính; chưa có thì tính chuẩn theo calo mục tiêu
 * (20% đạm, 30% béo, 50% tinh bột, 14 g xơ / 1000 kcal) — cùng cách làm với trang chi tiết thực đơn của web.
 */
export function resolveDailyTargets(plan: Pick<MealPlan, 'estimatedTargets' | 'targetCalories'>): EstimatedTargets {
  if (plan.estimatedTargets) return plan.estimatedTargets;
  const calories = plan.targetCalories > 0 ? plan.targetCalories : DEFAULT_CALORIES;
  return {
    proteinGrams: round2((calories * 0.2) / 4),
    fatGrams: round2((calories * 0.3) / 9),
    carbohydrateGrams: round2((calories * 0.5) / 4),
    fiberGrams: round2((calories / 1000) * 14),
    tolerancePercent: FALLBACK_TOLERANCE_PERCENT,
    sourceDetail: 'Mục tiêu được ước tính từ thông tin thể trạng và mục tiêu sức khỏe của bạn.',
  };
}
