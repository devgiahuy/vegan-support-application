import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import { mealAnalysisMapper } from '../mappers/meal-analysis.mapper';
import type { MealAnalysisResponseDto } from '../types/meal-analysis.dto';
import type { MealAnalysis } from '../types/meal-analysis.model';

export const mealAnalysisApi = {
  getCurrent: async (mealPlanId: string): Promise<MealAnalysis> => {
    const res = await api.get<MealAnalysisResponseDto>(API_ENDPOINTS.MEAL_PLANS.ANALYSIS(mealPlanId), {
      silent: true,
    });
    return mealAnalysisMapper.toResponseModel(res.data);
  },

  analyze: async (mealPlanId: string, expectedPlanVersion: number): Promise<MealAnalysis> => {
    const res = await api.post<MealAnalysisResponseDto>(
      API_ENDPOINTS.MEAL_PLANS.ANALYZE(mealPlanId),
      mealAnalysisMapper.toAnalyzeDto(expectedPlanVersion)
    );
    return mealAnalysisMapper.toResponseModel(res.data);
  },
};
