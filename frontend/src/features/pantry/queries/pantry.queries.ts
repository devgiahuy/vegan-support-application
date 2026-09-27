import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pantryApi } from '../api/pantry.api';
import type {
  PantryListQueryDto,
  ExpiringSoonQueryDto,
  PantryAdjustmentListQueryDto,
  CreatePantryItemReqDto,
  UpdatePantryItemReqDto,
  CreatePantryAdjustmentReqDto,
  MergePreviewReqDto,
  MergePantryItemsReqDto,
} from '../types/pantry.dto';
import type { PantryItem, PantryAdjustment, PantryMergePreview } from '../types/pantry.model';
import type { PaginationResult } from '@/types/api';

export const PANTRY_QUERY_KEYS = {
  all: ['pantry'] as const,
  items: () => [...PANTRY_QUERY_KEYS.all, 'items'] as const,
  itemsList: (params?: PantryListQueryDto) =>
    [...PANTRY_QUERY_KEYS.items(), 'list', params] as const,
  itemDetail: (id: string) => [...PANTRY_QUERY_KEYS.items(), 'detail', id] as const,
  expiringSoon: (params?: ExpiringSoonQueryDto) =>
    [...PANTRY_QUERY_KEYS.items(), 'expiring-soon', params] as const,
  adjustments: (id: string, params?: PantryAdjustmentListQueryDto) =>
    [...PANTRY_QUERY_KEYS.itemDetail(id), 'adjustments', params] as const,
};

/**
 * Hook truy vấn danh sách nguyên liệu trong tủ bếp
 */
export function usePantryItemsQuery(
  params?: PantryListQueryDto,
  options?: Omit<
    UseQueryOptions<PaginationResult<PantryItem>, Error, PaginationResult<PantryItem>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: PANTRY_QUERY_KEYS.itemsList(params),
    queryFn: () => pantryApi.getItems(params),
    ...options,
  });
}

/**
 * Hook truy vấn chi tiết một nguyên liệu
 */
export function usePantryItemDetailQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: PANTRY_QUERY_KEYS.itemDetail(id),
    queryFn: () => pantryApi.getItemById(id),
    enabled: Boolean(id) && enabled,
  });
}

/**
 * Hook truy vấn danh sách thực phẩm sắp hết hạn
 */
export function useExpiringSoonQuery(params?: ExpiringSoonQueryDto) {
  return useQuery({
    queryKey: PANTRY_QUERY_KEYS.expiringSoon(params),
    queryFn: () => pantryApi.getExpiringSoon(params),
  });
}

/**
 * Hook truy vấn sổ cái lịch sử điều chỉnh số lượng
 */
export function usePantryAdjustmentsQuery(
  id: string,
  params?: PantryAdjustmentListQueryDto,
  enabled = true
) {
  return useQuery({
    queryKey: PANTRY_QUERY_KEYS.adjustments(id, params),
    queryFn: () => pantryApi.getAdjustments(id, params),
    enabled: Boolean(id) && enabled,
  });
}

/**
 * Mutation: Thêm nguyên liệu mới vào tủ bếp
 */
export function useCreatePantryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePantryItemReqDto) => pantryApi.createItem(payload),
    onSuccess: (result) => {
      toast.success(`Đã thêm "${result.item.displayName}" vào tủ bếp thành công!`);
      queryClient.invalidateQueries({ queryKey: PANTRY_QUERY_KEYS.all });
    },
  });
}

/**
 * Mutation: Cập nhật thông tin / hạn dùng / độ tươi
 */
export function useUpdatePantryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePantryItemReqDto }) =>
      pantryApi.updateItem(id, payload),
    onSuccess: (updated) => {
      toast.success(`Đã cập nhật thông tin "${updated.displayName}"`);
      queryClient.invalidateQueries({ queryKey: PANTRY_QUERY_KEYS.all });
    },
  });
}

/**
 * Mutation: Xóa mềm nguyên liệu khỏi tủ bếp
 */
export function useDeletePantryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, expectedVersion }: { id: string; expectedVersion: number }) =>
      pantryApi.deleteItem(id, expectedVersion),
    onSuccess: () => {
      toast.success('Đã xóa nguyên liệu khỏi tủ bếp');
      queryClient.invalidateQueries({ queryKey: PANTRY_QUERY_KEYS.all });
    },
  });
}

/**
 * Mutation: Tiêu hao / hoàn trả / điều chỉnh sổ cái
 */
export function useCreatePantryAdjustmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreatePantryAdjustmentReqDto }) =>
      pantryApi.createAdjustment(id, payload),
    onSuccess: (result) => {
      toast.success(
        `Đã ghi nhận ${result.adjustment.typeLabel.toLowerCase()} cho "${result.item.displayName}"!`
      );
      queryClient.invalidateQueries({ queryKey: PANTRY_QUERY_KEYS.all });
    },
  });
}

/**
 * Mutation: Xem trước gộp nguyên liệu trùng lặp
 */
export function usePreviewPantryMergeMutation() {
  return useMutation({
    mutationFn: (payload: MergePreviewReqDto) => pantryApi.previewMerge(payload),
  });
}

/**
 * Mutation: Thực hiện gộp các nguyên liệu trùng lặp nguyên tử
 */
export function useMergePantryItemsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MergePantryItemsReqDto) => pantryApi.mergeItems(payload),
    onSuccess: (survivingItem) => {
      toast.success(`Đã gộp thành công vào "${survivingItem.displayName}"!`);
      queryClient.invalidateQueries({ queryKey: PANTRY_QUERY_KEYS.all });
    },
  });
}
