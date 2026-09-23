import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { APIResponse } from '@/types/api';
import type {
  CommitUploadReservationRequestDto,
  CreateStorageAdjustmentRequestDto,
  CreateUploadReservationRequestDto,
  CreateUploadReservationResponseDto,
  DeleteMediaAssetRequestDto,
  StorageAccountListResponseDto,
  StorageAdjustmentListResponseDto,
  StorageAssetResponseDto,
  StoragePolicyDto,
  StoragePolicyListResponseDto,
  StorageUsageResponseDto,
  UpdateStoragePolicyRequestDto,
  UploadProviderParamsDto,
  UploadReservationResponseDto,
} from '../types/storage.dto';
import type {
  MediaAsset,
  StorageAccount,
  StorageAdjustment,
  StoragePolicy,
  StorageUsage,
  UploadReservation,
} from '../types/storage.model';
import { storageMapper } from '../mappers/storage.mapper';

export interface StorageUsageResult {
  usage: StorageUsage;
  policy: StoragePolicy;
}

export interface CreateReservationResult {
  reservation: UploadReservation;
  usage: StorageUsage;
  upload: UploadProviderParamsDto;
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

export const storageApi = {
  /**
   * Lấy thông tin dung lượng và chính sách áp dụng của tài khoản hiện tại.
   */
  getUsage: async (): Promise<StorageUsageResult> => {
    const res = await api.get<APIResponse<StorageUsageResponseDto>>(API_ENDPOINTS.STORAGE.ME);
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
      API_ENDPOINTS.UPLOADS.RESERVATIONS,
      payload
    );
    const data = res.data?.data;
    return {
      reservation: storageMapper.toReservationModel(data?.reservation),
      usage: storageMapper.toUsageModel(data?.usage),
      upload: data?.upload || { uploadUrl: '', url: '', fields: {} },
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
      API_ENDPOINTS.UPLOADS.COMMIT(reservationId),
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
      API_ENDPOINTS.UPLOADS.RELEASE(reservationId)
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
      API_ENDPOINTS.STORAGE.ASSET(assetId),
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
    const res = await api.get<APIResponse<StorageAccountListResponseDto>>(
      API_ENDPOINTS.ADMIN_STORAGE.ACCOUNTS,
      { params }
    );
    const data = res.data?.data;
    return {
      items: (data?.items || []).map((item) => storageMapper.toAccountModel(item)),
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      limit: data?.limit ?? 20,
      totalPages: data?.totalPages ?? 0,
    };
  },

  /**
   * [Admin] Xem danh sách chính sách lưu trữ.
   */
  getAdminPolicies: async (params?: {
    page?: number;
    limit?: number;
    active?: boolean;
  }): Promise<PaginatedResult<StoragePolicy>> => {
    const res = await api.get<APIResponse<StoragePolicyListResponseDto>>(
      API_ENDPOINTS.ADMIN_STORAGE.POLICIES,
      { params }
    );
    const data = res.data?.data;
    return {
      items: (data?.items || []).map((item) => storageMapper.toPolicyModel(item)),
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      limit: data?.limit ?? 20,
      totalPages: data?.totalPages ?? 0,
    };
  },

  /**
   * [Admin] Cập nhật cấu hình chính sách lưu trữ.
   */
  updateAdminPolicy: async (
    policyId: string,
    payload: UpdateStoragePolicyRequestDto
  ): Promise<StoragePolicy> => {
    const res = await api.patch<APIResponse<StoragePolicyDto>>(
      API_ENDPOINTS.ADMIN_STORAGE.POLICY(policyId),
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
    await api.post(API_ENDPOINTS.ADMIN_STORAGE.ACCOUNT_ADJUSTMENTS(userId), payload);
  },

  /**
   * [Admin] Xem lịch sử kiểm toán điều chỉnh hạn mức dung lượng.
   */
  getAdminAdjustments: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<PaginatedResult<StorageAdjustment>> => {
    const res = await api.get<APIResponse<StorageAdjustmentListResponseDto>>(
      API_ENDPOINTS.ADMIN_STORAGE.ADJUSTMENTS,
      { params }
    );
    const data = res.data?.data;
    return {
      items: (data?.items || []).map((item) => storageMapper.toAdjustmentModel(item)),
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      limit: data?.limit ?? 20,
      totalPages: data?.totalPages ?? 0,
    };
  },
};
