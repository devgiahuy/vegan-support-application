import api from '@/lib/axios';
import { DIET_RULES_ENDPOINTS } from '@/features/diet-preferences/constants/diet-rules.endpoints';
import { USERS_ENDPOINTS } from '@/common/constants/endpoints/users.endpoints';
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
    // Đọc data từ envelope trước khi chuyển sang UI model.
    const res = await api.post<DietRulePreviewResponseDto>(DIET_RULES_ENDPOINTS.PREVIEW, payload, {
      silent: true,
    });
    return dietMapper.toPreviewModel(res.data?.data);
  },

  saveDietPreferences: async (payload: SaveDietPreferencesRequestDto): Promise<DietPreference> => {
    const res = await api.put<DietPreferenceResponseDto>(
      USERS_ENDPOINTS.DIET_PREFERENCES,
      payload,
      { showErrorToast: true }
    );
    return dietMapper.toPreferenceModel(res.data?.data);
  },

  saveDietSchedule: async (payload: UpdateDietScheduleRequestDto): Promise<DietSchedule> => {
    const res = await api.put<DietScheduleResponseDto>(USERS_ENDPOINTS.DIET_SCHEDULE, payload, {
      showErrorToast: true,
    });
    return dietMapper.toScheduleModel(res.data?.data);
  },
};
