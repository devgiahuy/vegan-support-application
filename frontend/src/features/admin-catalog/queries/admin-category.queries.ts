import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { adminCategoryApi, type AdminCategoryListParams } from '../api/admin-category.api';
import type {
  CreateCategoryRequestDto,
  UpdateCategoryRequestDto,
} from '../types/admin-catalog.dto';
import { CATEGORY_QUERY_KEYS } from '@/features/category/queries/category.queries';
import { toast } from 'sonner';

export const ADMIN_CATEGORY_QUERY_KEYS = {
  all: ['admin-catalog', 'categories'] as const,
  list: (params?: AdminCategoryListParams) =>
    [...ADMIN_CATEGORY_QUERY_KEYS.all, 'list', params] as const,
};

function invalidateCatalog(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORY_QUERY_KEYS.all });
  // Cây public phải mất item đã archive / hiện item mới ngay.
  queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.all });
}

export const useAdminCategoriesQuery = (params?: AdminCategoryListParams) => {
  return useQuery({
    queryKey: ADMIN_CATEGORY_QUERY_KEYS.list(params),
    queryFn: () => adminCategoryApi.listCategories(params),
  });
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryRequestDto) => adminCategoryApi.createCategory(payload),
    onSuccess: () => {
      invalidateCatalog(queryClient);
      toast.success('Đã tạo danh mục.');
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryRequestDto }) =>
      adminCategoryApi.updateCategory(id, payload),
    onSuccess: () => {
      invalidateCatalog(queryClient);
      toast.success('Đã cập nhật danh mục.');
    },
  });
};

export const useArchiveCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, replacementId }: { id: string; replacementId?: string }) =>
      adminCategoryApi.archiveCategory(id, replacementId),
    onSuccess: () => {
      invalidateCatalog(queryClient);
      toast.success('Đã lưu trữ danh mục.');
    },
  });
};
