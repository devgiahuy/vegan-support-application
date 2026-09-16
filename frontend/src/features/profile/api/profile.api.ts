import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { ProfileResponseDto, UpdateBasicProfileRequestDto } from '../types/profile.dto';
import type { DetailedProfile } from '../types/profile.model';
import { profileMapper } from '../mappers/profile.mapper';

export const profileApi = {
  getDetailedProfile: async (): Promise<DetailedProfile> => {
    // `ProfileResponseDto` đã là envelope `{success,data,meta}` — đọc `res.data` trực tiếp.
    const res = await api.get<ProfileResponseDto>(API_ENDPOINTS.USERS.ME, {
      silent: true,
    });
    return profileMapper.toModel(res.data);
  },

  patchBasicProfile: async (payload: {
    displayName?: string;
    avatarUrl?: string | null;
  }): Promise<DetailedProfile> => {
    const body: UpdateBasicProfileRequestDto = profileMapper.toUpdateDto(payload);
    const res = await api.patch<ProfileResponseDto>(API_ENDPOINTS.USERS.ME, body, {
      showErrorToast: true,
    });
    return profileMapper.toModel(res.data);
  },
};
