import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { compositionApi } from '../api/composition.api';
import type { CompositionDraft } from '../types/composition.model';
import { toast } from 'sonner';

export const COMPOSITION_KEYS = {
  all: ['ingredient-compositions'] as const,
  detail: (id: string) => ['ingredient-compositions', id] as const,
  sources: ['ingredient-composition-sources'] as const,
};
export function useCompositionQuery(id: string, enabled: boolean) {
  return useQuery({
    queryKey: COMPOSITION_KEYS.detail(id),
    queryFn: () => compositionApi.get(id),
    enabled,
  });
}
export function useCompositionSourcesQuery(enabled: boolean) {
  return useQuery({ queryKey: COMPOSITION_KEYS.sources, queryFn: compositionApi.sources, enabled });
}
export function useSaveCompositionMutation(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ version, draft }: { version: number; draft: CompositionDraft }) =>
      compositionApi.save(id, version, draft),
    onSuccess: async (composition) => {
      client.setQueryData(COMPOSITION_KEYS.detail(id), composition);
      await Promise.all(
        [
          'ingredient-compositions',
          'ingredients',
          'admin-catalog',
          'recipes',
          'posts',
          'recommendations',
          'meal-plans',
          'meal-programs',
          'meal-analysis',
          'allergen-catalog',
        ].map((key) => client.invalidateQueries({ queryKey: [key] }))
      );
      toast.success('Đã lưu cấu tạo và nguồn rà soát.');
    },
  });
}
