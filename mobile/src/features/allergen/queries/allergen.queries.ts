import { useQuery } from '@tanstack/react-query';
import { allergenApi } from '../api/allergen.api';

export const ALLERGEN_QUERY_KEYS = {
  all: ['allergens'] as const,
  catalog: () => [...ALLERGEN_QUERY_KEYS.all, 'catalog'] as const,
};

/** Danh mục dị ứng chuẩn; thay đổi hiếm nên cache 10 phút. */
export const useAllergenCatalogQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ALLERGEN_QUERY_KEYS.catalog(),
    queryFn: () => allergenApi.getCatalog(),
    staleTime: 10 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
};
