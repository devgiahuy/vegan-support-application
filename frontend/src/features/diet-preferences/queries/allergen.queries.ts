import { useQuery } from '@tanstack/react-query';
import { allergenApi } from '../api/allergen.api';

export const ALLERGEN_QUERY_KEYS = { all: ['allergen-catalog'] as const };
export function useAllergenCatalogQuery() {
  return useQuery({
    queryKey: ALLERGEN_QUERY_KEYS.all,
    queryFn: allergenApi.list,
    staleTime: 5 * 60_000,
  });
}
