import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { dietPreferencesMapper } from '../mappers/diet-preferences.mapper';
import { dietImpactMapper } from '../mappers/diet-impact.mapper';
import { mealProgramMapper } from '@/features/meal-program/mappers/meal-program.mapper';
import type { MealProgramResponseDto } from '@/features/meal-program/types/meal-program.dto';
import type { MealProgram } from '@/features/meal-program/types/meal-program.model';
import type { DietPreferenceResponseDto, DietRulePreviewResponseDto } from '../types/diet-preferences.dto';
import type { DietaryImpactResponseDto, DietaryRepairPreviewRequestDto, DietaryRepairApplyRequestDto, DietaryProgramRevisionRequestDto, DietaryRepairPreviewResponseDto, DietaryRepairApplyResponseDto } from '../types/diet-impact.dto';
import type { DietRulePreview, SaveDietPreferencesInput, SavedDietPreferences } from '../types/diet-preferences.model';
import type { FoodAllowanceSelection } from '../types/food-allowances.model';
import type { DietaryImpact, DietaryRepairPreview, DietaryRepairResult } from '../types/diet-impact.model';

export type DietSelection = FoodAllowanceSelection;
export type { SaveDietPreferencesInput } from '../types/diet-preferences.model';
const LONG_REQUEST = { timeout: 180000, silent: true } as const;

export const dietPreferencesApi = {
  previewRules: async (selection: DietSelection): Promise<DietRulePreview> => {
    const payload = { allowEggs: selection.allowEggs, allowDairy: selection.allowDairy, allowHoney: selection.allowHoney, allowFivePungent: selection.allowFivePungent };
    const res = await api.post<DietRulePreviewResponseDto>(API_ENDPOINTS.DIET_RULES.PREVIEW, payload, { silent: true });
    if (!res.data.data) throw new Error('Không tải được chính sách ăn uống. Vui lòng thử lại.');
    return dietPreferencesMapper.toPreviewModel(res.data);
  },
  previewImpact: async (input: SaveDietPreferencesInput): Promise<DietaryImpact> => {
    const res = await api.post<DietaryImpactResponseDto>(
      API_ENDPOINTS.USERS.DIET_IMPACT, dietPreferencesMapper.toSaveDto(input), LONG_REQUEST,
    );
    if (!res.data.data || !Array.isArray(res.data.data.plans)) throw new Error('Không kiểm tra được ảnh hưởng tới thực đơn. Vui lòng thử lại.');
    return dietImpactMapper.toModel(res.data.data);
  },
  saveDietPreferences: async (input: SaveDietPreferencesInput): Promise<SavedDietPreferences> => {
    const res = await api.put<DietPreferenceResponseDto>(
      API_ENDPOINTS.USERS.DIET_PREFERENCES, dietPreferencesMapper.toSaveDto(input), LONG_REQUEST,
    );
    return dietPreferencesMapper.toSavedModel(res.data);
  },
  previewRepair: async (input: DietaryRepairPreviewRequestDto): Promise<DietaryRepairPreview> => {
    const res = await api.post<DietaryRepairPreviewResponseDto>(API_ENDPOINTS.MEAL_PLANS.REPAIR_PREVIEW, input, LONG_REQUEST);
    if (!res.data.data?.proposalId) throw new Error('Không tạo được phương án thay món. Thực đơn vẫn được giữ nguyên.');
    return dietImpactMapper.toRepairPreview(res.data.data);
  },
  applyRepair: async (input: DietaryRepairApplyRequestDto): Promise<DietaryRepairResult> => {
    const res = await api.post<DietaryRepairApplyResponseDto>(API_ENDPOINTS.MEAL_PLANS.REPAIR_APPLY, input, LONG_REQUEST);
    if (!res.data.data || !Array.isArray(res.data.data.results)) throw new Error('Chưa xác định được kết quả thay món. Hãy tải lại thực đơn trước khi thử lại.');
    return dietImpactMapper.toRepairResult(res.data.data);
  },
  createProgramRevision: async (programId: string, input: DietaryProgramRevisionRequestDto): Promise<MealProgram> => {
    const res = await api.post<MealProgramResponseDto>(API_ENDPOINTS.MEAL_PROGRAMS.DIET_REVISION(programId), input, LONG_REQUEST);
    if (!res.data.data?.id) throw new Error('Chưa xác định được bản điều chỉnh. Hãy tải lại danh sách lộ trình.');
    return mealProgramMapper.toResponseModel(res.data);
  },
};
