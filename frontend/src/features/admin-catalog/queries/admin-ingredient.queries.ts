import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { adminIngredientApi, type AdminIngredientListParams } from '../api/admin-ingredient.api';
import type {
  CreateIngredientRequestDto,
  UpdateIngredientRequestDto,
} from '../types/admin-catalog.dto';
import { INGREDIENT_QUERY_KEYS } from '@/features/ingredient/queries/ingredient.queries';
import { toast } from 'sonner';

export const ADMIN_INGREDIENT_QUERY_KEYS = {
  all: ['admin-catalog', 'ingredients'] as const,
  list: (params?: AdminIngredientListParams) =>
    [...ADMIN_INGREDIENT_QUERY_KEYS.all, 'list', params] as const,
};

function invalidateIngredients(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ADMIN_INGREDIENT_QUERY_KEYS.all });
  // Alias/metadata ảnh hưởng tra cứu public → refresh luôn.
  queryClient.invalidateQueries({ queryKey: INGREDIENT_QUERY_KEYS.all });
}

export const useAdminIngredientsQuery = (params?: AdminIngredientListParams) => {
  return useQuery({
    queryKey: ADMIN_INGREDIENT_QUERY_KEYS.list(params),
    queryFn: () => adminIngredientApi.listIngredients(params),
  });
};

export const useCreateIngredientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIngredientRequestDto) =>
      adminIngredientApi.createIngredient(payload),
    onSuccess: () => {
      invalidateIngredients(queryClient);
      toast.success('Đã tạo nguyên liệu.');
    },
  });
};

export const useUpdateIngredientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateIngredientRequestDto }) =>
      adminIngredientApi.updateIngredient(id, payload),
    onSuccess: () => {
      invalidateIngredients(queryClient);
      toast.success('Đã cập nhật nguyên liệu.');
    },
  });
};

export const useArchiveIngredientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminIngredientApi.archiveIngredient(id),
    onSuccess: () => {
      invalidateIngredients(queryClient);
      toast.success('Đã lưu trữ nguyên liệu.');
    },
  });
};

export const useAddAliasMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, alias }: { id: string; alias: string }) =>
      adminIngredientApi.addAlias(id, alias),
    onSuccess: () => {
      invalidateIngredients(queryClient);
      toast.success('Đã thêm tên gọi khác.');
    },
  });
};

export const useDeleteAliasMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, aliasId }: { id: string; aliasId: string }) =>
      adminIngredientApi.deleteAlias(id, aliasId),
    onSuccess: () => {
      invalidateIngredients(queryClient);
      toast.success('Đã xóa tên gọi khác.');
    },
  });
};
