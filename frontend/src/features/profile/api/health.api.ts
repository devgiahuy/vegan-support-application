import api from '@/lib/axios';
import { APIResponse } from '@/types/api';
import { USERS_ENDPOINTS } from '@/common/constants/endpoints/users.endpoints';
import type { HealthProfileDto, HealthProfileRequestDto } from '../types/health.dto';
import type { HealthProfile } from '../types/health.model';
import { healthMapper } from '../mappers/health.mapper';

export const healthApi = {
  saveHealthProfile: async (payload: HealthProfileRequestDto): Promise<HealthProfile> => {
    const res = await api.put<APIResponse<HealthProfileDto>>(
      USERS_ENDPOINTS.HEALTH_PROFILE,
      payload,
      { showErrorToast: true }
    );
    return healthMapper.toModel(res.data.data);
  },
};
