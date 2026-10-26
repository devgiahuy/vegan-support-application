import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError, getApiErrorCode, isAxiosError } from '@/lib/api-error';
import { recipeDraftApi } from '../api/recipe-draft.api';
import type { RecipeDraftPrompt, RecipeDraftSuggestion } from '../types/recipe-draft.model';

export const RECIPE_DRAFT_QUERY_KEYS = {
  all: ['recipe-drafts'] as const,
  generate: () => [...RECIPE_DRAFT_QUERY_KEYS.all, 'generate'] as const,
};

/**
 * Hook tạo bản gợi ý công thức thuần chay bằng AI
 */
export function useGenerateRecipeDraftMutation(options?: {
  onSuccess?: (data: RecipeDraftSuggestion) => void;
  onError?: (err: unknown) => void;
}) {
  return useMutation({
    mutationKey: RECIPE_DRAFT_QUERY_KEYS.generate(),
    mutationFn: (prompt: RecipeDraftPrompt) => recipeDraftApi.generateDraft(prompt),
    onSuccess: (data) => {
      toast.success('Đã tạo gợi ý công thức thành công!', {
        description: `Trợ lý AI đã đề xuất định lượng cho ${data.ingredients.length} nguyên liệu và ${data.steps.length} bước nấu.`,
      });
      options?.onSuccess?.(data);
    },
    onError: (err: unknown) => {
      const code = getApiErrorCode(err);
      if (code === 'RECIPE_DRAFT_UNAVAILABLE') {
        toast.error('Trợ lý AI hiện chưa khả dụng', {
          description:
            'Tính năng gợi ý công thức AI đang tạm đóng hoặc bảo trì. Bạn có thể tiếp tục nhập công thức thủ công.',
        });
      } else if (code === 'RECIPE_DRAFT_GENERATION_FAILED') {
        toast.error('Không thể tạo bản gợi ý', {
          description:
            'AI không thể xử lý yêu cầu lúc này. Vui lòng thử lại với tên nguyên liệu rõ ràng hơn hoặc nhập thủ công.',
        });
      } else if (isAxiosError(err) && err.code === 'ECONNABORTED') {
        toast.error('Quá thời gian phản hồi', {
          description:
            'Quá trình tạo gợi ý mất nhiều thời gian hơn dự kiến do có nhiều nguyên liệu. Vui lòng thử lại hoặc giảm bớt số lượng nguyên liệu.',
        });
      } else {
        toastApiError(
          err,
          'Lỗi gợi ý công thức',
          'Vui lòng kiểm tra lại thông tin đầu vào và kết nối mạng.'
        );
      }
      options?.onError?.(err);
    },
  });
}
