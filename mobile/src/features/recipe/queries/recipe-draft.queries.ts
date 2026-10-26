import { useMutation } from '@tanstack/react-query';
import { recipeDraftApi } from '../api/recipe-draft.api';
import type { RecipeDraftPrompt } from '../types/recipe-draft.model';

/** Mỗi lần gọi là một yêu cầu mới (có thể tốn lượt AI) nên không cache, chỉ dùng mutation. */
export function useGenerateRecipeDraftMutation() {
  return useMutation({ mutationFn: (prompt: RecipeDraftPrompt) => recipeDraftApi.generate(prompt) });
}
