import api from '@/lib/axios';
import { USERS_ENDPOINTS } from '@/common/constants/endpoints/users.endpoints';
import type { ProfileResponseDto, UpdateBasicProfileRequestDto } from '../types/profile.dto';
import type { DetailedProfile } from '../types/profile.model';
import { profileMapper } from '../mappers/profile.mapper';

export const profileApi = {
  getDetailedProfile: async (): Promise<DetailedProfile> => {
    // `ProfileResponseDto` đã là envelope `{success,data,meta}` — đọc `res.data` trực tiếp.
    const res = await api.get<ProfileResponseDto>(USERS_ENDPOINTS.ME, {
      silent: true,
    });
    return profileMapper.toModel(res.data?.data);
  },

  patchBasicProfile: async (payload: {
    displayName?: string;
    avatarUrl?: string | null;
  }): Promise<DetailedProfile> => {
    const body: UpdateBasicProfileRequestDto = profileMapper.toUpdateDto(payload);
    const res = await api.patch<ProfileResponseDto>(USERS_ENDPOINTS.ME, body, {
      showErrorToast: true,
    });
    return profileMapper.toModel(res.data?.data);
  },
};
