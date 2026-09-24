import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';
import { dietPreferencesMapper } from '../mappers/diet-preferences.mapper';
import { toDietSummary } from '@/features/profile/mappers/profile.mapper';
import type {
  DietPreferenceResponseDto,
  DietRulePreviewResponseDto,
  SaveDietPreferencesRequestDto,
} from '../types/diet-preferences.dto';
import type { DietRulePreview, DraftAllergy, DraftIngredientExclusion } from '../types/diet-preferences.model';
import type { DietPreferenceSummary } from '@/features/profile/types/profile.model';

export interface DietSelection {
  dietPattern: DietPattern;
  practiceSchedule: PracticeSchedule;
  tradition: Tradition;
}

export interface SaveDietPreferencesInput extends DietSelection {
  ruleSetVersion: number;
  ruleSelections: { ruleDefinitionId: string; enabled: boolean }[];
  scheduleDates?: string[];
  allergies: DraftAllergy[];
  ingredientExclusions: DraftIngredientExclusion[];
}

export const dietPreferencesApi = {
  /** `POST /diet-rules/preview` — xem trước rule set áp dụng cho 1 lựa chọn, chưa lưu. */
  previewRules: async (selection: DietSelection): Promise<DietRulePreview> => {
    const res = await api.post<DietRulePreviewResponseDto>(API_ENDPOINTS.DIET_RULES.PREVIEW, selection);
    return dietPreferencesMapper.toPreviewModel(res.data);
  },

  /** `PUT /users/me/diet-preferences` — lưu chế độ ăn + rule set + dị ứng + loại trừ. */
  saveDietPreferences: async (input: SaveDietPreferencesInput): Promise<DietPreferenceSummary | null> => {
    const payload: SaveDietPreferencesRequestDto = {
      dietPattern: input.dietPattern,
      practiceSchedule: input.practiceSchedule,
      tradition: input.tradition,
      ruleSetVersion: input.ruleSetVersion,
      rules: input.ruleSelections,
      scheduleDates: input.scheduleDates,
      allergies: input.allergies.map((a) => ({
        allergenCode: a.allergenCode,
        label: a.label || undefined,
        severity: a.severity,
      })),
      ingredientExclusions: input.ingredientExclusions.map((e) => ({
        ingredientName: e.ingredientName,
        reason: e.reason,
      })),
    };
    const res = await api.put<DietPreferenceResponseDto>(API_ENDPOINTS.USERS.DIET_PREFERENCES, payload);
    return toDietSummary(res.data?.data as Record<string, unknown> | null);
  },
};
