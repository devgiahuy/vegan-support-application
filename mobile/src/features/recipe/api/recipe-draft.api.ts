import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { recipeDraftMapper } from '../mappers/recipe-draft.mapper';
import type { GenerateRecipeDraftResponseDto } from '../types/recipe-draft.dto';
import type { RecipeDraftPrompt, RecipeDraftSuggestion } from '../types/recipe-draft.model';

/** AI soạn nháp có thể mất tới ~1 phút (BE `AI_TIMEOUT_MS` mặc định 60s) nên dài hơn timeout mặc định của axios. */
const GENERATE_TIMEOUT_MS = 75_000;

export const recipeDraftApi = {
  /** `POST /recipe-drafts/generate` — chỉ xem trước, không tạo bài và không đổi Tủ bếp. */
  generate: async (prompt: RecipeDraftPrompt): Promise<RecipeDraftSuggestion> => {
    const res = await api.post<GenerateRecipeDraftResponseDto>(
      API_ENDPOINTS.RECIPE_DRAFTS.GENERATE,
      recipeDraftMapper.toDto(prompt),
      { timeout: GENERATE_TIMEOUT_MS, silent: true }
    );
    return recipeDraftMapper.toModel(res.data);
  },
};
