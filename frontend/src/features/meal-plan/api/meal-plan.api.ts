import api from '@/lib/axios';
import { MEAL_PLANS_ENDPOINTS } from '@/common/constants/endpoints/meal-plans.endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  DeleteMealPlanResponseDto,
  ManualAddMealPlanItemRequestDto,
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
 * Đọc data và metadata từ response envelope trước khi gọi mapper.
 */
export const mealPlanApi = {
  /** `POST /meal-plans/generate` — mỗi lần gọi tạo version mới. */
  generate: async (input: GenerateMealPlanInput): Promise<MealPlan> => {
    const res = await api.post<MealPlanResponseDto>(
      MEAL_PLANS_ENDPOINTS.GENERATE,
      mealPlanMapper.toGenerateDto(input),
      { showErrorToast: true }
    );
    return mealPlanMapper.toDetailModel(res.data?.data);
  },

  /** `GET /meal-plans` — lịch sử phiên bản của current user. */
  getPlans: async (params?: MealPlanListQueryParams): Promise<PaginationResult<MealPlan>> => {
    const res = await api.get<MealPlanListResponseDto>(MEAL_PLANS_ENDPOINTS.LIST, {
      params: {
        page: params?.page,
        limit: params?.limit,
        ...(params?.weekStart ? { weekStart: params.weekStart } : {}),
      },
      silent: true,
    });
    return mealPlanMapper.toListModel(res.data?.data, res.data?.meta);
  },

  /** `GET /meal-plans/:id` — chi tiết 21 slots + shopping list. */
  getPlanDetail: async (id: string): Promise<MealPlan> => {
    const res = await api.get<MealPlanResponseDto>(MEAL_PLANS_ENDPOINTS.DETAIL(id), {
      silent: true,
    });
    return mealPlanMapper.toDetailModel(res.data?.data);
  },

  /** `PATCH /meal-plans/:id/items/:itemId/swap` — đổi món version-gated. */
  swapItem: async (
    planId: string,
    itemId: string,
    expectedVersion: number,
    idempotencyKey: string
  ): Promise<MealPlan> => {
    const res = await api.patch<MealPlanResponseDto>(
      MEAL_PLANS_ENDPOINTS.SWAP(planId, itemId),
      mealPlanMapper.toSwapDto(expectedVersion, idempotencyKey),
      { showErrorToast: true }
    );
    return mealPlanMapper.toDetailModel(res.data?.data);
  },

  /** `PATCH /meal-plans/:id/items/:itemId/manual-add` — thêm món cá nhân hoặc công thức vào ô thực đơn. */
  manualAddItem: async (
    planId: string,
    itemId: string,
    body: ManualAddMealPlanItemRequestDto
  ): Promise<MealPlan> => {
    const res = await api.patch<MealPlanResponseDto>(
      MEAL_PLANS_ENDPOINTS.MANUAL_ADD(planId, itemId),
      body,
      // Hook tự toast theo mã lỗi; tránh toast trùng từ interceptor.
      { silent: true }
    );
    return mealPlanMapper.toDetailModel(res.data?.data);
  },

  /** `DELETE /meal-plans/:id?expectedVersion=` — soft-delete idempotent. */
  deletePlan: async (
    id: string,
    expectedVersion: number
  ): Promise<{ id: string; deleted: boolean }> => {
    const res = await api.delete<DeleteMealPlanResponseDto>(MEAL_PLANS_ENDPOINTS.DELETE(id), {
      params: { expectedVersion },
      showErrorToast: true,
    });
    return mealPlanMapper.toDeleteModel(res.data?.data);
  },
};
