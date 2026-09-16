import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type {
  DietPreferenceResponseDto,
  DietRulePreviewRequestDto,
  DietRulePreviewResponseDto,
  DietScheduleResponseDto,
  SaveDietPreferencesRequestDto,
  UpdateDietScheduleRequestDto,
} from '../types/diet.dto';
import type { DietPreference, DietPreview, DietSchedule } from '../types/diet.model';
import { dietMapper } from '../mappers/diet.mapper';

export const dietApi = {
  previewDietRules: async (payload: DietRulePreviewRequestDto): Promise<DietPreview> => {
    // Các DTO `*ResponseDto` đã là envelope — đọc `res.data` trực tiếp, không bọc `APIResponse<>`.
    const res = await api.post<DietRulePreviewResponseDto>(
      API_ENDPOINTS.DIET_RULES.PREVIEW,
      payload,
      { silent: true }
    );
    return dietMapper.toPreviewModel(res.data);
  },

  saveDietPreferences: async (payload: SaveDietPreferencesRequestDto): Promise<DietPreference> => {
    const res = await api.put<DietPreferenceResponseDto>(
      API_ENDPOINTS.USERS.DIET_PREFERENCES,
      payload,
      { showErrorToast: true }
    );
    return dietMapper.toPreferenceModel(res.data);
  },

  saveDietSchedule: async (payload: UpdateDietScheduleRequestDto): Promise<DietSchedule> => {
    const res = await api.put<DietScheduleResponseDto>(API_ENDPOINTS.USERS.DIET_SCHEDULE, payload, {
      showErrorToast: true,
    });
    return dietMapper.toScheduleModel(res.data);
  },
};
