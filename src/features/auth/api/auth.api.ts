import api from '@/lib/axios';
import { APIResponse } from '@/types/api';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { LoginResponseDto, UserDto } from '../types/auth.dto';
import { AuthSession, User } from '../types/auth.model';
import { authMapper } from '../mappers/auth.mapper';

export interface LoginPayload {
  email: string;
  password?: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthSession> => {
    const res = await api.post<APIResponse<LoginResponseDto>>(
      API_ENDPOINTS.AUTH.LOGIN,
      payload,
      { showErrorToast: true }
    );
    return authMapper.toSessionModel(res.data.data);
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<APIResponse<UserDto>>(API_ENDPOINTS.AUTH.ME);
    return authMapper.toModel(res.data.data);
  },

  logout: async (): Promise<void> => {
    await api.post(API_ENDPOINTS.AUTH.LOGOUT, {}, { silent: true });
  },

  refreshToken: async (): Promise<string> => {
    const res = await api.post<APIResponse<{ access_token: string }>>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      {},
      { silent: true }
    );
    return res.data.data?.access_token || '';
  },
};
