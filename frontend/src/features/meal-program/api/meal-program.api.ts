import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type {
  CreateMealProgramRequestDto,
  MealProgramDto,
  MealProgramListResponseDto,
  RegenerateWeekRequestDto,
  UpdateMealProgramRequestDto,
  UpdateWeekProgressRequestDto,
} from '../types/meal-program.dto';
import type { MealProgram, MealProgramListResult } from '../types/meal-program.model';
import { mealProgramMapper } from '../mappers/meal-program.mapper';

export interface MealProgramQueryParams {
  page?: number;
  limit?: number;
  type?: 'TEMPLATES' | 'MY_PROGRAMS';
  status?: string;
}

export const mealProgramApi = {
  /**
   * Lấy danh sách chương trình dinh dưỡng (Mẫu hoặc cá nhân)
   */
  getMealPrograms: async (params?: MealProgramQueryParams): Promise<MealProgramListResult> => {
    const res = await api.get<{ data: MealProgramListResponseDto }>(
      API_ENDPOINTS.MEAL_PROGRAMS.LIST,
      { params }
    );
    return mealProgramMapper.toListResult(res.data?.data);
  },

  /**
   * Lấy chi tiết một chương trình dinh dưỡng
   */
  getMealProgramDetail: async (id: string): Promise<MealProgram> => {
    const res = await api.get<{ data: MealProgramDto }>(API_ENDPOINTS.MEAL_PROGRAMS.DETAIL(id));
    return mealProgramMapper.toModel(res.data?.data);
  },

  /**
   * Khởi tạo chương trình dinh dưỡng nhiều tuần mới (Trạng thái DRAFT)
   */
  createMealProgram: async (data: CreateMealProgramRequestDto): Promise<MealProgram> => {
    const res = await api.post<{ data: MealProgramDto }>(API_ENDPOINTS.MEAL_PROGRAMS.CREATE, data);
    return mealProgramMapper.toModel(res.data?.data);
  },

  /**
   * Cập nhật trạng thái hoặc thông tin chương trình (Xác nhận CONFIRMED, lưu trữ ARCHIVED...)
   */
  updateMealProgram: async (
    id: string,
    data: UpdateMealProgramRequestDto
  ): Promise<MealProgram> => {
    const res = await api.patch<{ data: MealProgramDto }>(
      API_ENDPOINTS.MEAL_PROGRAMS.UPDATE(id),
      data
    );
    return mealProgramMapper.toModel(res.data?.data);
  },

  /**
   * Tái tạo hoặc sinh lại thực đơn cho một tuần cụ thể
   */
  regenerateProgramWeek: async (
    id: string,
    weekNumber: number,
    data: RegenerateWeekRequestDto
  ): Promise<MealProgram> => {
    const res = await api.post<{ data: MealProgramDto }>(
      API_ENDPOINTS.MEAL_PROGRAMS.REGENERATE_WEEK(id, weekNumber),
      data
    );
    return mealProgramMapper.toModel(res.data?.data);
  },

  /**
   * Kích hoạt tái phân tích dinh dưỡng tích lũy và lặp món cho lộ trình
   */
  reanalyzeMealProgram: async (id: string): Promise<MealProgram> => {
    const res = await api.post<{ data: MealProgramDto }>(API_ENDPOINTS.MEAL_PROGRAMS.REANALYZE(id));
    return mealProgramMapper.toModel(res.data?.data);
  },

  /**
   * Cập nhật tiến độ hoàn thành các bữa ăn trong một tuần
   */
  updateWeekProgress: async (
    id: string,
    weekNumber: number,
    data: UpdateWeekProgressRequestDto
  ): Promise<MealProgram> => {
    const res = await api.patch<{ data: MealProgramDto }>(
      API_ENDPOINTS.MEAL_PROGRAMS.UPDATE_PROGRESS(id, weekNumber),
      data
    );
    return mealProgramMapper.toModel(res.data?.data);
  },
};
