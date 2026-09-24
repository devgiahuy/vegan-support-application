import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storageApi, type StorageUsageResult, type PaginatedResult } from '../api/storage.api';
import type {
  CreateStorageAdjustmentRequestDto,
  UpdateStoragePolicyRequestDto,
} from '../types/storage.dto';
import type {
  MediaAsset,
  MediaKind,
  StorageAccount,
  StorageAdjustment,
  StoragePolicy,
} from '../types/storage.model';
import { uploadWithReservation } from '../api/storage-upload';

export const STORAGE_KEYS = {
  all: ['storage'] as const,
  me: () => [...STORAGE_KEYS.all, 'me'] as const,
  admin: () => [...STORAGE_KEYS.all, 'admin'] as const,
  adminAccounts: (params?: { page?: number; limit?: number; q?: string; overQuota?: boolean }) =>
    [...STORAGE_KEYS.admin(), 'accounts', params] as const,
  adminPolicies: (params?: { page?: number; limit?: number; active?: boolean }) =>
    [...STORAGE_KEYS.admin(), 'policies', params] as const,
  adminAdjustments: (params?: { page?: number; limit?: number; userId?: string }) =>
    [...STORAGE_KEYS.admin(), 'adjustments', params] as const,
};

/**
 * Hook truy vấn thông tin dung lượng và hạn ngạch tài khoản hiện tại.
 */
export const useStorageUsageQuery = (enabled = true) => {
  return useQuery<StorageUsageResult>({
    queryKey: STORAGE_KEYS.me(),
    queryFn: () => storageApi.getUsage(),
    enabled,
    staleTime: 60 * 1000, // 1 phút
  });
};

/**
 * Hook xóa vĩnh viễn media asset và tự động cập nhật lại hạn mức dung lượng.
 */
export const useDeleteMediaAssetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, idempotencyKey }: { assetId: string; idempotencyKey: string }) =>
      storageApi.deleteAsset(assetId, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORAGE_KEYS.me() });
    },
  });
};

/**
 * Hook tải lên tệp tin qua cơ chế reservation 3 bước có rollback tự động.
 */
export const useUploadWithReservationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      kind,
      onProgress,
      signal,
    }: {
      file: File;
      kind: MediaKind;
      onProgress?: (progress: { loaded: number; total: number; percent: number }) => void;
      signal?: AbortSignal;
    }) => uploadWithReservation(file, { kind, onProgress, signal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORAGE_KEYS.me() });
    },
  });
};

/**
 * Hook [Admin] tra cứu danh sách tài khoản và hạn mức sử dụng.
 */
export const useAdminStorageAccountsQuery = (
  params?: { page?: number; limit?: number; q?: string; overQuota?: boolean },
  enabled = true
) => {
  return useQuery<PaginatedResult<StorageAccount>>({
    queryKey: STORAGE_KEYS.adminAccounts(params),
    queryFn: () => storageApi.getAdminAccounts(params),
    enabled,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook [Admin] tra cứu danh sách chính sách lưu trữ.
 */
export const useAdminStoragePoliciesQuery = (
  params?: { page?: number; limit?: number; active?: boolean },
  enabled = true
) => {
  return useQuery<PaginatedResult<StoragePolicy>>({
    queryKey: STORAGE_KEYS.adminPolicies(params),
    queryFn: () => storageApi.getAdminPolicies(params),
    enabled,
    staleTime: 60 * 1000,
  });
};

/**
 * Hook [Admin] cập nhật cấu hình chính sách lưu trữ.
 */
export const useUpdateStoragePolicyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      policyId,
      payload,
    }: {
      policyId: string;
      payload: UpdateStoragePolicyRequestDto;
    }) => storageApi.updateAdminPolicy(policyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORAGE_KEYS.admin() });
      queryClient.invalidateQueries({ queryKey: STORAGE_KEYS.me() });
    },
  });
};

/**
 * Hook [Admin] điều chỉnh hạn mức dung lượng thủ công.
 */
export const useCreateStorageAdjustmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: CreateStorageAdjustmentRequestDto;
    }) => storageApi.createAdminAdjustment(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORAGE_KEYS.admin() });
      queryClient.invalidateQueries({ queryKey: STORAGE_KEYS.me() });
    },
  });
};

/**
 * Hook [Admin] xem lịch sử kiểm toán điều chỉnh hạn ngạch.
 */
export const useAdminStorageAdjustmentsQuery = (
  params?: { page?: number; limit?: number; userId?: string },
  enabled = true
) => {
  return useQuery<PaginatedResult<StorageAdjustment>>({
    queryKey: STORAGE_KEYS.adminAdjustments(params),
    queryFn: () => storageApi.getAdminAdjustments(params),
    enabled,
    staleTime: 30 * 1000,
  });
};
