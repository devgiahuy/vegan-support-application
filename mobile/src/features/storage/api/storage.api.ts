import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import type { APIResponse } from '@/types/api';
import { storageMapper } from '../mappers/storage.mapper';
import type {
  CreateReservationResponseDto,
  ReservationResponseDto,
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
  async release(id: string) {
    const res = await api.delete<APIResponse<ReservationResponseDto>>(
      API_ENDPOINTS.STORAGE.RELEASE(id)
    );
    return storageMapper.toReservation(res.data.data);
  },
};
