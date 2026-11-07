import api from '@/lib/axios';
import { STORAGE_ENDPOINTS } from '@/features/storage/constants/storage.endpoints';
import { UPLOADS_ENDPOINTS } from '@/common/constants/endpoints/uploads.endpoints';
import { ADMIN_STORAGE_ENDPOINTS } from '@/features/storage/constants/admin-storage.endpoints';
import type { APIResponse } from '@/types/api';
import type {
  CommitUploadReservationRequestDto,
  CreateStorageAdjustmentRequestDto,
  CreateUploadReservationRequestDto,
  CreateUploadReservationResponseDto,
  DeleteMediaAssetRequestDto,
  StorageAccountDto,
  StorageAdjustmentDto,
  StorageAssetResponseDto,
  StoragePolicyDto,
  StoragePageResponseDto,
  StorageUsageResponseDto,
  UpdateStoragePolicyRequestDto,
  UploadReservationResponseDto,
} from '../types/storage.dto';
import type {
  MediaAsset,
  StorageAccount,
  StorageAdjustment,
  StoragePolicy,
  StorageUsage,
  UploadReservation,
  StorageUploadParams,
} from '../types/storage.model';
import { storageMapper } from '../mappers/storage.mapper';

export interface StorageUsageResult {
  usage: StorageUsage;
  policy: StoragePolicy;
}

export interface CreateReservationResult {
  reservation: UploadReservation;
  usage: StorageUsage;
  upload: StorageUploadParams;
}

export interface ReservationResult {
  reservation: UploadReservation;
  usage: StorageUsage;
}

export interface StorageAssetResult {
  asset: MediaAsset | null;
  usage: StorageUsage;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function unwrapStoragePage<T>(body: StoragePageResponseDto<T> | null | undefined) {
  if (body?.success !== true || !Array.isArray(body.data) || !body.meta) {
    throw new Error('Phản hồi danh sách lưu trữ không đúng định dạng.');
  }
  return body;
}

export const storageApi = {
  /**
   * Lấy thông tin dung lượng và chính sách áp dụng của tài khoản hiện tại.
   */
  getUsage: async (): Promise<StorageUsageResult> => {
    const res = await api.get<APIResponse<StorageUsageResponseDto>>(STORAGE_ENDPOINTS.ME);
    const data = res.data?.data;
    return {
      usage: storageMapper.toUsageModel(data?.usage),
      policy: storageMapper.toPolicyModel(data?.policy),
    };
  },

  /**
   * Tạo phiên giữ trước dung lượng (reservation) và nhận tham số ký upload Cloudinary.
   */
  createReservation: async (
    payload: CreateUploadReservationRequestDto
  ): Promise<CreateReservationResult> => {
    const res = await api.post<APIResponse<CreateUploadReservationResponseDto>>(
      UPLOADS_ENDPOINTS.RESERVATIONS,
      payload
    );
    const data = res.data?.data;
    return {
      reservation: storageMapper.toReservationModel(data?.reservation),
      usage: storageMapper.toUsageModel(data?.usage),
      upload: storageMapper.toUploadParamsModel(data?.upload),
    };
  },

  /**
   * Commit reservation sau khi đã truyền file thành công lên Cloudinary.
   */
  commitReservation: async (
    reservationId: string,
    payload: CommitUploadReservationRequestDto
  ): Promise<ReservationResult> => {
    const res = await api.post<APIResponse<UploadReservationResponseDto>>(
      UPLOADS_ENDPOINTS.COMMIT(reservationId),
      payload
    );
    const data = res.data?.data;
    return {
      reservation: storageMapper.toReservationModel(data?.reservation),
      usage: storageMapper.toUsageModel(data?.usage),
    };
  },

  /**
   * Hủy phiên giữ trước (release) khi upload lỗi hoặc người dùng hủy giữa chừng.
   */
  releaseReservation: async (reservationId: string): Promise<ReservationResult> => {
    const res = await api.delete<APIResponse<UploadReservationResponseDto>>(
      UPLOADS_ENDPOINTS.RELEASE(reservationId)
    );
    const data = res.data?.data;
    return {
      reservation: storageMapper.toReservationModel(data?.reservation),
      usage: storageMapper.toUsageModel(data?.usage),
    };
  },

  /**
   * Xóa bền vững MediaAsset thuộc quyền sở hữu để giải phóng dung lượng.
   */
  deleteAsset: async (assetId: string, idempotencyKey: string): Promise<StorageAssetResult> => {
    const res = await api.delete<APIResponse<StorageAssetResponseDto>>(
      STORAGE_ENDPOINTS.ASSET(assetId),
      {
        data: { idempotencyKey } as DeleteMediaAssetRequestDto,
      }
    );
    const data = res.data?.data;
    return {
      asset: storageMapper.toMediaAssetModel(data?.asset),
      usage: storageMapper.toUsageModel(data?.usage),
    };
  },

  /**
   * [Admin] Xem danh sách tài khoản lưu trữ và mức sử dụng dung lượng.
   */
  getAdminAccounts: async (params?: {
    page?: number;
    limit?: number;
    q?: string;
    overQuota?: boolean;
  }): Promise<PaginatedResult<StorageAccount>> => {
    const res = await api.get<StoragePageResponseDto<StorageAccountDto>>(
      ADMIN_STORAGE_ENDPOINTS.ACCOUNTS,
      { params }
    );
    const { data, meta } = unwrapStoragePage(res.data);
    return storageMapper.toPageModel(data, meta, (item) => storageMapper.toAccountModel(item));
  },

  /**
   * [Admin] Xem danh sách chính sách lưu trữ.
   */
  getAdminPolicies: async (params?: {
    page?: number;
    limit?: number;
    active?: boolean;
  }): Promise<PaginatedResult<StoragePolicy>> => {
    const res = await api.get<StoragePageResponseDto<StoragePolicyDto>>(
      ADMIN_STORAGE_ENDPOINTS.POLICIES,
      { params }
    );
    const { data, meta } = unwrapStoragePage(res.data);
    return storageMapper.toPageModel(data, meta, (item) => storageMapper.toPolicyModel(item));
  },

  /**
   * [Admin] Cập nhật cấu hình chính sách lưu trữ.
   */
  updateAdminPolicy: async (
    policyId: string,
    payload: UpdateStoragePolicyRequestDto
  ): Promise<StoragePolicy> => {
    const res = await api.patch<APIResponse<StoragePolicyDto>>(
      ADMIN_STORAGE_ENDPOINTS.POLICY(policyId),
      payload
    );
    return storageMapper.toPolicyModel(res.data?.data);
  },

  /**
   * [Admin] Điều chỉnh hạn mức dung lượng thủ công cho một tài khoản.
   */
  createAdminAdjustment: async (
    userId: string,
    payload: CreateStorageAdjustmentRequestDto
  ): Promise<void> => {
    await api.post(ADMIN_STORAGE_ENDPOINTS.ACCOUNT_ADJUSTMENTS(userId), payload);
  },

  /**
   * [Admin] Xem lịch sử kiểm toán điều chỉnh hạn mức dung lượng.
   */
  getAdminAdjustments: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<PaginatedResult<StorageAdjustment>> => {
    const res = await api.get<StoragePageResponseDto<StorageAdjustmentDto>>(
      ADMIN_STORAGE_ENDPOINTS.ADJUSTMENTS,
      { params }
    );
    const { data, meta } = unwrapStoragePage(res.data);
    return storageMapper.toPageModel(data, meta, (item) => storageMapper.toAdjustmentModel(item));
  },
};
