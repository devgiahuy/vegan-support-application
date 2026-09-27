import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type {
  AnalyzeMealPlanRequestDto,
  MealPlanAnalysisResponseDto,
} from '../types/meal-analysis.dto';
import type { MealPlanAnalysis } from '../types/meal-analysis.model';
import { mealAnalysisMapper } from '../mappers/meal-analysis.mapper';

/**
 * Consumer endpoint phân tích thực đơn tuần Phase 18.
 * `POST /meal-plans/:id/analyze`
 * `GET /meal-plans/:id/analysis`
 */
export const mealAnalysisApi = {
  /**
   * Phân tích khẩu phần & độ tương thích thực đơn tuần.
   * Nhận kết quả và chuyển đổi an toàn sang Clean UI Model.
   */
  analyzeMealPlan: async (
    planId: string,
    payload: AnalyzeMealPlanRequestDto
  ): Promise<MealPlanAnalysis> => {
    const res = await api.post<MealPlanAnalysisResponseDto | { data: MealPlanAnalysisResponseDto }>(
      API_ENDPOINTS.MEAL_PLANS.ANALYZE(planId),
      payload,
      { showErrorToast: true }
    );
    return mealAnalysisMapper.toModel(res.data, payload.expectedPlanVersion);
  },

  /**
   * Lấy kết quả phân tích hiện tại của thực đơn tuần (nếu có).
   */
  getCurrentAnalysis: async (
    planId: string,
    currentPlanLockVersion?: number
  ): Promise<MealPlanAnalysis | null> => {
    try {
      const res = await api.get<
        MealPlanAnalysisResponseDto | { data: MealPlanAnalysisResponseDto }
      >(API_ENDPOINTS.MEAL_PLANS.ANALYSIS(planId), { silent: true });
      return mealAnalysisMapper.toModel(res.data, currentPlanLockVersion);
    } catch {
      return null;
    }
  },
};
