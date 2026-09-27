import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import { mealProgramMapper } from '../mappers/meal-program.mapper';
import type { MealProgramListResponseDto, MealProgramResponseDto } from '../types/meal-program.dto';
import type { CreateMealProgramInput, MealProgram, MealProgramListResult } from '../types/meal-program.model';

export interface MealProgramQueryParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const mealProgramApi = {
  list: async (params?: MealProgramQueryParams): Promise<MealProgramListResult> => {
    const res = await api.get<MealProgramListResponseDto>(API_ENDPOINTS.MEAL_PROGRAMS.LIST, {
      params,
      silent: true,
    });
    return mealProgramMapper.toListModel(res.data);
  },

  detail: async (id: string): Promise<MealProgram> => {
    const res = await api.get<MealProgramResponseDto>(API_ENDPOINTS.MEAL_PROGRAMS.DETAIL(id), { silent: true });
    return mealProgramMapper.toModel(res.data.data);
  },

  create: async (input: CreateMealProgramInput): Promise<MealProgram> => {
    const res = await api.post<MealProgramResponseDto>(
      API_ENDPOINTS.MEAL_PROGRAMS.LIST,
      mealProgramMapper.toCreateDto(input)
    );
    return mealProgramMapper.toModel(res.data.data);
  },

  confirm: async (id: string, expectedVersion: number): Promise<MealProgram> => {
    const res = await api.patch<MealProgramResponseDto>(
      API_ENDPOINTS.MEAL_PROGRAMS.DETAIL(id),
      mealProgramMapper.toConfirmDto(expectedVersion)
    );
    return mealProgramMapper.toModel(res.data.data);
  },
};

