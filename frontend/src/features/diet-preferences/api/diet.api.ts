import api from '@/lib/axios';
import { DIET_RULES_ENDPOINTS } from '../constants/diet-rules.endpoints';
import { USERS_ENDPOINTS } from '@/common/constants/endpoints/users.endpoints';
import type { DietPreferenceResponseDto, DietRulePreviewResponseDto } from '../types/diet.dto';
import type { FoodAllowances } from '../types/food-allowances.model';
import type { DietPreferenceDraft } from '../types/diet.model';
import { dietMapper } from '../mappers/diet.mapper';

export const dietApi = {
  async previewDietRules(input: FoodAllowances) {
    const response = await api.post<DietRulePreviewResponseDto>(
      DIET_RULES_ENDPOINTS.PREVIEW,
      {
        allowEggs: input.allowEggs,
        allowDairy: input.allowDairy,
        allowHoney: input.allowHoney,
        allowFivePungent: input.allowFivePungent,
      },
      { silent: true }
    );
    if (!response.data.data?.policyVersion)
      throw new Error('Không đọc được chính sách ăn uống. Vui lòng thử lại.');
    return dietMapper.toPreviewModel(response.data.data);
  },
  async saveDietPreferences(input: DietPreferenceDraft) {
    const response = await api.put<DietPreferenceResponseDto>(
      USERS_ENDPOINTS.DIET_PREFERENCES,
      dietMapper.toSaveDto(input),
      { silent: true }
    );
    const result = dietMapper.toPreferenceModel(response.data.data);
    if (!result.selectionValid || result.dietaryRevision <= 0) {
      throw new Error('Không đọc được kết quả lưu. Hãy tải lại hồ sơ trước khi thử lưu lại.');
    }
    return { ...result, impactUnavailable: result.impactUnavailable || !result.impact };
  },
};
