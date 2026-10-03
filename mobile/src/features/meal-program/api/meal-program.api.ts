import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import { mealProgramMapper } from '../mappers/meal-program.mapper';
import type { MealProgramListResponseDto, MealProgramResponseDto } from '../types/meal-program.dto';
import type {
  CreateMealProgramInput,
  MealProgram,
  MealProgramAction,
  MealProgramListResult,
} from '../types/meal-program.model';

export interface MealProgramQueryParams {
  page?: number;
  limit?: number;
  status?: string;
}

/** Sinh nhiều tuần cùng lúc có thể mất lâu hơn mặc định 15 giây. */
const GENERATION_TIMEOUT_MS = 60000;

/** Múi giờ của thiết bị, dự phòng giờ Việt Nam khi môi trường không cung cấp. */
function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
  } catch {
    return 'Asia/Ho_Chi_Minh';
  }
}

export const mealProgramApi = {
  /** `GET /meal-programs`. */
  list: async (params?: MealProgramQueryParams): Promise<MealProgramListResult> => {
    const res = await api.get<MealProgramListResponseDto>(API_ENDPOINTS.MEAL_PROGRAMS.LIST, {
      params,
      silent: true,
    });
    return mealProgramMapper.toListModel(res.data);
  },

  /** `GET /meal-programs/:id`. */
  detail: async (id: string): Promise<MealProgram> => {
    const res = await api.get<MealProgramResponseDto>(API_ENDPOINTS.MEAL_PROGRAMS.DETAIL(id), { silent: true });
    return mealProgramMapper.toResponseModel(res.data);
  },

  /** `POST /meal-programs` — tạo và sinh phương án cho từng tuần. */
  create: async (input: CreateMealProgramInput): Promise<MealProgram> => {
    const res = await api.post<MealProgramResponseDto>(
      API_ENDPOINTS.MEAL_PROGRAMS.LIST,
      mealProgramMapper.toCreateDto(input, deviceTimezone()),
      { timeout: GENERATION_TIMEOUT_MS }
    );
    return mealProgramMapper.toResponseModel(res.data);
  },

  /** `PATCH /meal-programs/:id` — đổi tên, chọn phương án, sinh lại tuần, phân tích lại, xác nhận. */
  update: async (id: string, action: MealProgramAction, expectedVersion: number): Promise<MealProgram> => {
    const res = await api.patch<MealProgramResponseDto>(
      API_ENDPOINTS.MEAL_PROGRAMS.DETAIL(id),
      mealProgramMapper.toPatchDto(action, expectedVersion),
      { timeout: GENERATION_TIMEOUT_MS }
    );
    return mealProgramMapper.toResponseModel(res.data);
  },
};
