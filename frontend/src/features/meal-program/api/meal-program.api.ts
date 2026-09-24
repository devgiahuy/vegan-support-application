import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type {
  CreateMealProgramRequestDto,
  MealProgramDto,
  MealProgramListResponseDto,
  PatchMealProgramActionDto,
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

function generateIdempotencyKey(prefix = 'mp'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
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
   * Backend schema là .strict() với startDate (bắt buộc Thứ Hai), goal (MAINTAIN | LOSE | GAIN),
   * horizonWeeks, timezone, idempotencyKey
   */
  createMealProgram: async (data: CreateMealProgramRequestDto): Promise<MealProgram> => {
    const payload = {
      title: data.title.trim(),
      goal: data.goal,
      startDate: data.startDate,
      timezone:
        data.timezone ||
        (typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : 'Asia/Bangkok'),
      horizonWeeks: Number(data.horizonWeeks),
      alternativesPerWeek: data.alternativesPerWeek ?? 2,
      ...(data.seed?.trim() ? { seed: data.seed.trim() } : {}),
      idempotencyKey: data.idempotencyKey?.trim() || generateIdempotencyKey('create'),
    };
    const res = await api.post<{ data: MealProgramDto }>(
      API_ENDPOINTS.MEAL_PROGRAMS.CREATE,
      payload
    );
    return mealProgramMapper.toModel(res.data?.data);
  },

  /**
   * Thực hiện các hành động cập nhật lộ trình qua PATCH /meal-programs/:id với discriminated union action
   */
  patchMealProgram: async (id: string, action: PatchMealProgramActionDto): Promise<MealProgram> => {
    const payload = {
      ...action,
      idempotencyKey:
        action.idempotencyKey?.trim() || generateIdempotencyKey(action.action.toLowerCase()),
    };
    const res = await api.patch<{ data: MealProgramDto }>(
      API_ENDPOINTS.MEAL_PROGRAMS.UPDATE(id),
      payload
    );
    return mealProgramMapper.toModel(res.data?.data);
  },

  /**
   * Xác nhận lộ trình DRAFT -> CONFIRMED
   */
  confirmMealProgram: async (id: string, expectedVersion: number): Promise<MealProgram> => {
    return mealProgramApi.patchMealProgram(id, {
      action: 'CONFIRM',
      expectedVersion,
    });
  },

  /**
   * Tái phân tích dinh dưỡng tích lũy và lặp món cho toàn lộ trình
   */
  reanalyzeMealProgram: async (id: string, expectedVersion = 1): Promise<MealProgram> => {
    return mealProgramApi.patchMealProgram(id, {
      action: 'REANALYZE',
      expectedVersion,
    });
  },

  /**
   * Tái tạo hoặc sinh lại thực đơn cho một tuần cụ thể
   */
  regenerateProgramWeek: async (
    id: string,
    weekNumber: number,
    data: RegenerateWeekRequestDto
  ): Promise<MealProgram> => {
    const weekIndex =
      typeof data.weekIndex === 'number' ? data.weekIndex : Math.max(0, weekNumber - 1);
    return mealProgramApi.patchMealProgram(id, {
      action: 'REGENERATE_WEEK',
      expectedVersion: data.version,
      weekIndex,
      seed: data.seed,
      selectGenerated: true,
    });
  },

  /**
   * Chọn phương án thực đơn thay thế cho một tuần
   */
  selectAlternative: async (
    id: string,
    expectedVersion: number,
    weekIndex: number,
    alternativeRank: number
  ): Promise<MealProgram> => {
    return mealProgramApi.patchMealProgram(id, {
      action: 'SELECT_ALTERNATIVE',
      expectedVersion,
      weekIndex,
      alternativeRank,
    });
  },

  /**
   * Cập nhật thông tin lộ trình (Hỗ trợ tương thích ngược)
   */
  updateMealProgram: async (
    id: string,
    data: UpdateMealProgramRequestDto
  ): Promise<MealProgram> => {
    if (data.action) {
      return mealProgramApi.patchMealProgram(id, data as PatchMealProgramActionDto);
    }
    if (data.status === 'CONFIRMED') {
      return mealProgramApi.confirmMealProgram(id, data.expectedVersion || data.version || 1);
    }
    if (data.action === 'REANALYZE') {
      return mealProgramApi.reanalyzeMealProgram(id, data.expectedVersion || data.version || 1);
    }
    return mealProgramApi.patchMealProgram(id, {
      action: 'UPDATE_METADATA',
      expectedVersion: data.expectedVersion || data.version || 1,
      title: data.title || '',
    });
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
