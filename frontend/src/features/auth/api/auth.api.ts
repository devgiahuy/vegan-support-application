import api from '@/lib/axios';
import axios from 'axios';
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
    // Gọi Next handler để vừa proxy BE vừa xóa HttpOnly cookie cùng-domain.
    // Dùng axios thô (baseURL '') để tránh interceptor tự gắn refresh loop.
    try {
      await axios.post('/api/auth/logout', {}, { baseURL: '' });
    } catch {
      // BE down vẫn cho logout client, interceptor đã silent
      try {
        await api.post(API_ENDPOINTS.AUTH.LOGOUT, {}, { silent: true });
      } catch {
        /* noop */
      }
    }
  },

  refreshToken: async (): Promise<string> => {
    // Luôn đi qua Next proxy để forward HttpOnly cookie refreshToken.
    const res = await axios.post('/api/auth/refresh-token', {}, { baseURL: '' });
    const payload = (res.data as any)?.data ?? res.data;
    return payload?.access_token ?? payload?.accessToken ?? payload?.token ?? '';
  },
};
