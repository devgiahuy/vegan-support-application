import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foodDataApi, type FoodDataQueryParams } from '../api/food-data.api';
import type {
  CreateFoodDataRecordRequestDto,
  PreviewFoodDataImportRequestDto,
  CommitFoodDataImportRequestDto,
  ReplaceFoodDataRecordRequestDto,
} from '../types/food-data.dto';
import type { FoodDataRecordKind } from '../types/food-data.model';

export const FOOD_DATA_KEYS = {
  all: ['food-data'] as const,
  nutrients: (ingredientId: string, params?: { preparation?: string; locale?: string }) =>
    [...FOOD_DATA_KEYS.all, 'nutrients', ingredientId, params] as const,
  referenceIntakes: (params?: FoodDataQueryParams) =>
    [...FOOD_DATA_KEYS.all, 'reference-intakes', params] as const,
  guidelines: (params?: FoodDataQueryParams) =>
    [...FOOD_DATA_KEYS.all, 'guidelines', params] as const,
  cookingMethods: (params?: { page?: number; limit?: number }) =>
    [...FOOD_DATA_KEYS.all, 'cooking-methods', params] as const,
  interactions: (params?: FoodDataQueryParams) =>
    [...FOOD_DATA_KEYS.all, 'interactions', params] as const,
  adminRecords: (params: { kind: FoodDataRecordKind; page?: number; limit?: number }) =>
    [...FOOD_DATA_KEYS.all, 'admin-records', params] as const,
};

/**
 * Hook lấy giá trị dinh dưỡng chuẩn trên 100g của nguyên liệu.
 * Cache 5 phút vì dữ liệu dinh dưỡng chuẩn ít biến động.
 */
export const useIngredientNutrientsQuery = (
  ingredientId: string,
  params?: { preparation?: string; locale?: string },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: FOOD_DATA_KEYS.nutrients(ingredientId, params),
    queryFn: () => foodDataApi.getIngredientNutrients(ingredientId, params),
    enabled: Boolean(ingredientId) && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook tra cứu nhu cầu khuyến nghị (RDA/AI) và ngưỡng an toàn (UL).
 */
export const useReferenceIntakesQuery = (
  params?: FoodDataQueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: FOOD_DATA_KEYS.referenceIntakes(params),
    queryFn: () => foodDataApi.listReferenceIntakes(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook tra cứu hướng dẫn an toàn nguyên liệu.
 */
export const useIngredientGuidelinesQuery = (
  params?: FoodDataQueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: FOOD_DATA_KEYS.guidelines(params),
    queryFn: () => foodDataApi.listGuidelines(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook tra cứu phương pháp nấu nướng và hệ số bảo tồn / hao hụt.
 */
export const useCookingMethodsQuery = (
  params?: { page?: number; limit?: number },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: FOOD_DATA_KEYS.cookingMethods(params),
    queryFn: () => foodDataApi.listCookingMethods(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook tra cứu quy tắc tương tác / kiêng kỵ giữa các nguyên liệu.
 */
export const useInteractionRulesQuery = (
  params?: FoodDataQueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: FOOD_DATA_KEYS.interactions(params),
    queryFn: () => foodDataApi.listInteractionRules(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * [ADMIN] Hook lấy danh sách bản ghi dinh dưỡng phân trang theo kind.
 */
export const useAdminRecordsQuery = (
  params: { kind: FoodDataRecordKind; page?: number; limit?: number },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: FOOD_DATA_KEYS.adminRecords(params),
    queryFn: () => foodDataApi.listAdminRecords(params),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000, // 30s
  });
};

/**
 * [ADMIN] Hook tạo mới bản ghi dinh dưỡng.
 */
export const useCreateAdminRecordMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFoodDataRecordRequestDto) => foodDataApi.createAdminRecord(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...FOOD_DATA_KEYS.all, 'admin-records'] });
      queryClient.invalidateQueries({ queryKey: FOOD_DATA_KEYS.all });
    },
  });
};

/**
 * [ADMIN] Hook cập nhật thay thế toàn diện bản ghi.
 */
export const useReplaceAdminRecordMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReplaceFoodDataRecordRequestDto }) =>
      foodDataApi.replaceAdminRecord(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...FOOD_DATA_KEYS.all, 'admin-records'] });
      queryClient.invalidateQueries({ queryKey: FOOD_DATA_KEYS.all });
    },
  });
};

/**
 * [ADMIN] Hook lưu trữ mềm bản ghi dinh dưỡng.
 */
export const useArchiveAdminRecordMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: FoodDataRecordKind }) =>
      foodDataApi.archiveAdminRecord(id, kind),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...FOOD_DATA_KEYS.all, 'admin-records'] });
      queryClient.invalidateQueries({ queryKey: FOOD_DATA_KEYS.all });
    },
  });
};

/**
 * [ADMIN] Hook xem trước gói dữ liệu nạp từ nguồn bên ngoài.
 */
export const useAdminImportPreviewMutation = () => {
  return useMutation({
    mutationFn: (input: PreviewFoodDataImportRequestDto) => foodDataApi.previewImport(input),
  });
};

/**
 * [ADMIN] Hook cam kết (Commit) lưu gói dữ liệu đã xem trước.
 */
export const useAdminImportCommitMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CommitFoodDataImportRequestDto) => foodDataApi.commitImport(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOOD_DATA_KEYS.all });
    },
  });
};
