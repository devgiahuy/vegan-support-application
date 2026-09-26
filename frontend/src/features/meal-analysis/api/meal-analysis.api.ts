import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { MealPlanAnalysisResponseDto } from '../types/meal-analysis.dto';
import type { MealPlanAnalysis } from '../types/meal-analysis.model';
import { mealAnalysisMapper } from '../mappers/meal-analysis.mapper';

/**
 * Consumer endpoint phân tích thực đơn tuần Phase 18.
 * `POST /meal-plans/:id/analyze`
 */
export const mealAnalysisApi = {
  /**
   * Phân tích khẩu phần & độ tương thích thực đơn tuần.
   * Nhận kết quả và chuyển đổi an toàn sang Clean UI Model.
   */
  analyzeMealPlan: async (
    planId: string,
    currentPlanLockVersion?: number
  ): Promise<MealPlanAnalysis> => {
    const res = await api.post<MealPlanAnalysisResponseDto | { data: MealPlanAnalysisResponseDto }>(
      API_ENDPOINTS.MEAL_PLANS.ANALYZE(planId),
      {},
      { showErrorToast: true }
    );
    return mealAnalysisMapper.toModel(res.data, currentPlanLockVersion);
  },
};
