import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../api/category.api';
import type { CategoryType } from '@/common/enums';

export const CATEGORY_QUERY_KEYS = {
  all: ['categories'] as const,
  tree: (type?: CategoryType) => [...CATEGORY_QUERY_KEYS.all, 'tree', type ?? 'all'] as const,
};

/** Cây public: không cần auth, cache 10 phút vì ít thay đổi. */
export const useCategoryTreeQuery = (type?: CategoryType) => {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.tree(type),
    queryFn: () => categoryApi.getTree(type),
    staleTime: 10 * 60 * 1000,
  });
};
