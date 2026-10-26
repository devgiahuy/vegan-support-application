import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { recipeDraftMapper } from '../mappers/recipe-draft.mapper';
import type {
  GenerateRecipeDraftRequestDto,
  GenerateRecipeDraftResponseDto,
} from '../types/recipe-draft.dto';
import type { RecipeDraftPrompt, RecipeDraftSuggestion } from '../types/recipe-draft.model';

export const recipeDraftApi = {
  /**
   * Gợi ý bản nháp công thức từ AI bằng tên món, mô tả và danh sách nguyên liệu
   */
  generateDraft: async (prompt: RecipeDraftPrompt): Promise<RecipeDraftSuggestion> => {
    const payload: GenerateRecipeDraftRequestDto = recipeDraftMapper.toDto(prompt);
    const res = await api.post<GenerateRecipeDraftResponseDto>(
      API_ENDPOINTS.RECIPE_DRAFTS.GENERATE,
      payload,
      {
        timeout: 60000,
        silent: true,
      }
    );

    if (res.data?.success && res.data.data) {
      return recipeDraftMapper.toModel(res.data);
    }
    throw new Error('Phản hồi gợi ý công thức AI không đúng định dạng.');
  },
};
