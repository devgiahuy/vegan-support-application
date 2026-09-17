import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  DeleteMealPlanResponseDto,
  MealPlanListResponseDto,
  MealPlanResponseDto,
} from '../types/meal-plan.dto';
import type {
  GenerateMealPlanInput,
  MealPlan,
  MealPlanListQueryParams,
} from '../types/meal-plan.model';
import { mealPlanMapper } from '../mappers/meal-plan.mapper';

/**
 * Consumer 5 endpoint meal-plan đã `READY`.
 * Envelope `{success, data, meta}` đọc `res.data` trực tiếp — cấm bọc `APIResponse<>`.
 */
export const mealPlanApi = {
  /** `POST /meal-plans/generate` — mỗi lần gọi tạo version mới. */
  generate: async (input: GenerateMealPlanInput): Promise<MealPlan> => {
    const res = await api.post<MealPlanResponseDto>(
      API_ENDPOINTS.MEAL_PLANS.GENERATE,
      mealPlanMapper.toGenerateDto(input),
      { showErrorToast: true }
    );
    return mealPlanMapper.toDetailModel(res.data);
  },

  /** `GET /meal-plans` — lịch sử phiên bản của current user. */
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

  /** `GET /meal-plans/:id` — chi tiết 21 slots + shopping list. */
  getPlanDetail: async (id: string): Promise<MealPlan> => {
    const res = await api.get<MealPlanResponseDto>(API_ENDPOINTS.MEAL_PLANS.DETAIL(id), {
      silent: true,
    });
    return mealPlanMapper.toDetailModel(res.data);
  },

  /** `PATCH /meal-plans/:id/items/:itemId/swap` — đổi món version-gated. */
  swapItem: async (
    planId: string,
    itemId: string,
    expectedVersion: number,
    idempotencyKey: string
  ): Promise<MealPlan> => {
    const res = await api.patch<MealPlanResponseDto>(
      API_ENDPOINTS.MEAL_PLANS.SWAP(planId, itemId),
      mealPlanMapper.toSwapDto(expectedVersion, idempotencyKey),
      { showErrorToast: true }
    );
    return mealPlanMapper.toDetailModel(res.data);
  },

  /** `DELETE /meal-plans/:id?expectedVersion=` — soft-delete idempotent. */
  deletePlan: async (
    id: string,
    expectedVersion: number
  ): Promise<{ id: string; deleted: boolean }> => {
    const res = await api.delete<DeleteMealPlanResponseDto>(API_ENDPOINTS.MEAL_PLANS.DELETE(id), {
      params: { expectedVersion },
      showErrorToast: true,
    });
    return mealPlanMapper.toDeleteModel(res.data);
  },
};
