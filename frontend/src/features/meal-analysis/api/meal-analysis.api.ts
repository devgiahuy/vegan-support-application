import api from '@/lib/axios';
import { MEAL_PLANS_ENDPOINTS } from '@/common/constants/endpoints/meal-plans.endpoints';
import type {
  AnalyzeMealPlanRequestDto,
  MealPlanAnalysisResponseDto,
} from '../types/meal-analysis.dto';
import type { MealPlanAnalysis } from '../types/meal-analysis.model';
import { mealAnalysisMapper } from '../mappers/meal-analysis.mapper';
import { getApiErrorCode } from '@/lib/api-error';

function unwrapAnalysis(
  dto: MealPlanAnalysisResponseDto | { success?: boolean; data: MealPlanAnalysisResponseDto }
): MealPlanAnalysisResponseDto {
  const data = dto && typeof dto === 'object' && 'data' in dto ? dto.data : dto;
  if (!data || !data.id || ('success' in dto && dto.success === false)) {
    throw new Error('Phản hồi phân tích thực đơn không đúng định dạng.');
  }
  return data;
}

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
    const res = await api.post<
      MealPlanAnalysisResponseDto | { success?: boolean; data: MealPlanAnalysisResponseDto }
    >(MEAL_PLANS_ENDPOINTS.ANALYZE(planId), payload, { showErrorToast: true });
    return mealAnalysisMapper.toModel(unwrapAnalysis(res.data), payload.expectedPlanVersion);
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
        MealPlanAnalysisResponseDto | { success?: boolean; data: MealPlanAnalysisResponseDto }
      >(MEAL_PLANS_ENDPOINTS.ANALYSIS(planId), { silent: true });
      return mealAnalysisMapper.toModel(unwrapAnalysis(res.data), currentPlanLockVersion);
    } catch (error) {
      if (getApiErrorCode(error) === 'MEAL_ANALYSIS_NOT_FOUND') return null;
      throw error;
    }
  },
};
