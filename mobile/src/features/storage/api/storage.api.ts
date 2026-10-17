import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import type { APIResponse } from '@/types/api';
import { storageMapper } from '../mappers/storage.mapper';
import type {
  CreateReservationResponseDto,
  DeleteMediaAssetRequestDto,
  ReservationResponseDto,
  StorageAssetResponseDto,
  StorageUsageResponseDto,
} from '../types/storage.dto';
import type { ProviderUploadReceipt, ReservationInput } from '../types/storage.model';

export const storageApi = {
  async getAccount() {
    const res = await api.get<APIResponse<StorageUsageResponseDto>>(API_ENDPOINTS.STORAGE.ME, {
      silent: true,
    });
    return storageMapper.toModel(res.data.data);
  },
  async reserve(input: ReservationInput) {
    const res = await api.post<APIResponse<CreateReservationResponseDto>>(
      API_ENDPOINTS.STORAGE.RESERVATIONS,
      storageMapper.toCreateDto(input)
    );
    return storageMapper.toReservation(res.data.data);
  },
  async commit(id: string, receipt: ProviderUploadReceipt) {
    const res = await api.post<APIResponse<ReservationResponseDto>>(
      API_ENDPOINTS.STORAGE.COMMIT(id),
      storageMapper.toCommitDto(receipt)
    );
    return storageMapper.toReservation(res.data.data);
  },
  /**
   * `DELETE /storage/assets/:id` — xóa bền vững tệp thuộc tài khoản để giải phóng dung lượng. Bị chặn
   * (`MEDIA_ASSET_IN_USE`) khi tệp vẫn được nội dung chưa xóa tham chiếu. Trả về dung lượng sau khi xóa.
   */
  async deleteAsset(assetId: string, idempotencyKey: string) {
    const body: DeleteMediaAssetRequestDto = { idempotencyKey };
    const res = await api.delete<APIResponse<StorageAssetResponseDto>>(API_ENDPOINTS.STORAGE.ASSET(assetId), {
      data: body,
    });
    const data = res.data.data;
    if (!data) throw new Error('Không nhận được dung lượng sau khi xóa tệp.');
    return storageMapper.toUsage(data.usage);
  },
  async release(id: string) {
    const res = await api.delete<APIResponse<ReservationResponseDto>>(
      API_ENDPOINTS.STORAGE.RELEASE(id)
    );
    return storageMapper.toReservation(res.data.data);
  },
};
