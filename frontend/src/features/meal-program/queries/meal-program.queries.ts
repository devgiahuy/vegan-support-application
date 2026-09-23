import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mealProgramApi, type MealProgramQueryParams } from '../api/meal-program.api';
import type {
  CreateMealProgramRequestDto,
  RegenerateWeekRequestDto,
  UpdateMealProgramRequestDto,
  UpdateWeekProgressRequestDto,
} from '../types/meal-program.dto';
import type { MealProgram, MealProgramListResult } from '../types/meal-program.model';

export const MEAL_PROGRAM_KEYS = {
  all: ['meal-programs'] as const,
  lists: () => [...MEAL_PROGRAM_KEYS.all, 'list'] as const,
  list: (params?: MealProgramQueryParams) => [...MEAL_PROGRAM_KEYS.lists(), params] as const,
  details: () => [...MEAL_PROGRAM_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...MEAL_PROGRAM_KEYS.details(), id] as const,
};

/**
 * Hook truy vấn danh sách chương trình dinh dưỡng (Mẫu hoặc Cá nhân)
 */
export const useMealProgramsQuery = (params?: MealProgramQueryParams, enabled = true) => {
  return useQuery<MealProgramListResult>({
    queryKey: MEAL_PROGRAM_KEYS.list(params),
    queryFn: () => mealProgramApi.getMealPrograms(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 phút
  });
};

/**
 * Hook truy vấn chi tiết một chương trình dinh dưỡng
 */
export const useMealProgramDetailQuery = (id: string, enabled = true) => {
  return useQuery<MealProgram>({
    queryKey: MEAL_PROGRAM_KEYS.detail(id),
    queryFn: () => mealProgramApi.getMealProgramDetail(id),
    enabled: Boolean(id) && enabled,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Mutation tạo mới lộ trình dinh dưỡng (DRAFT)
 */
export const useCreateMealProgramMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<MealProgram, Error, CreateMealProgramRequestDto>({
    mutationFn: (data) => mealProgramApi.createMealProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_PROGRAM_KEYS.lists() });
    },
  });
};

/**
 * Mutation cập nhật lộ trình (Xác nhận CONFIRMED, lưu trữ ARCHIVED, cập nhật tiêu đề...)
 */
export const useUpdateMealProgramMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<MealProgram, Error, UpdateMealProgramRequestDto>({
    mutationFn: (data) => mealProgramApi.updateMealProgram(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(MEAL_PROGRAM_KEYS.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: MEAL_PROGRAM_KEYS.lists() });
    },
  });
};

/**
 * Mutation tái tạo một tuần lẻ trong lộ trình
 */
export const useRegenerateProgramWeekMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<MealProgram, Error, { weekNumber: number; data: RegenerateWeekRequestDto }>({
    mutationFn: ({ weekNumber, data }) =>
      mealProgramApi.regenerateProgramWeek(id, weekNumber, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(MEAL_PROGRAM_KEYS.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: MEAL_PROGRAM_KEYS.lists() });
    },
  });
};

/**
 * Mutation tái phân tích dinh dưỡng tích lũy và lặp món
 */
export const useReanalyzeMealProgramMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<MealProgram, Error, void>({
    mutationFn: () => mealProgramApi.reanalyzeMealProgram(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(MEAL_PROGRAM_KEYS.detail(id), updated);
    },
  });
};

/**
 * Mutation cập nhật tiến độ hoàn thành các bữa ăn trong tuần
 */
export const useUpdateWeekProgressMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    MealProgram,
    Error,
    { weekNumber: number; data: UpdateWeekProgressRequestDto }
  >({
    mutationFn: ({ weekNumber, data }) => mealProgramApi.updateWeekProgress(id, weekNumber, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(MEAL_PROGRAM_KEYS.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: MEAL_PROGRAM_KEYS.lists() });
    },
  });
};
