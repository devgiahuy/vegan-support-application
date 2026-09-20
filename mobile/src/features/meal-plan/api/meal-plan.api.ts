import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import type { PaginationResult } from '@/types/api';
import { mealPlanMapper } from '../mappers/meal-plan.mapper';
import type { DeleteMealPlanResponseDto, MealPlanListResponseDto, MealPlanResponseDto } from '../types/meal-plan.dto';
import type { GenerateMealPlanInput, MealPlan, MealPlanListQueryParams } from '../types/meal-plan.model';

export const mealPlanApi = {
  generate: async (input: GenerateMealPlanInput): Promise<MealPlan> => {
    const res = await api.post<MealPlanResponseDto>(
      API_ENDPOINTS.MEAL_PLANS.GENERATE,
      mealPlanMapper.toGenerateDto(input)
    );
    return mealPlanMapper.toDetailModel(res.data);
  },

  getPlans: async (params?: MealPlanListQueryParams): Promise<PaginationResult<MealPlan>> => {
    const res = await api.get<MealPlanListResponseDto>(API_ENDPOINTS.MEAL_PLANS.LIST, {
      params: {
        page: params?.page,
        limit: params?.limit,
        ...(params?.weekStart ? { weekStart: params.weekStart } : {}),
      },
      silent: true,
    });
    return mealPlanMapper.toListModel(res.data);
  },

  getPlanDetail: async (id: string): Promise<MealPlan> => {
    const res = await api.get<MealPlanResponseDto>(API_ENDPOINTS.MEAL_PLANS.DETAIL(id), {
      silent: true,
    });
    return mealPlanMapper.toDetailModel(res.data);
  },

  swapItem: async (
    planId: string,
    itemId: string,
    expectedVersion: number,
    idempotencyKey: string
  ): Promise<MealPlan> => {
    const res = await api.patch<MealPlanResponseDto>(
      API_ENDPOINTS.MEAL_PLANS.SWAP(planId, itemId),
      mealPlanMapper.toSwapDto(expectedVersion, idempotencyKey)
    );
    return mealPlanMapper.toDetailModel(res.data);
  },

  deletePlan: async (id: string, expectedVersion: number): Promise<{ id: string; deleted: boolean }> => {
    const res = await api.delete<DeleteMealPlanResponseDto>(API_ENDPOINTS.MEAL_PLANS.DELETE(id), {
      params: { expectedVersion },
    });
    return mealPlanMapper.toDeleteModel(res.data);
  },
};
