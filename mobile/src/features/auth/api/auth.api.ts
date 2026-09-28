import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import {
  AuthSessionResponseDto,
  LoginRequestDto,
  LogoutRequestDto,
  LogoutResponseDto,
  ProfileResponseDto,
  RefreshResponseDto,
} from '../types/auth.dto';
import { AuthSession, LogoutResult, User } from '../types/auth.model';
import type { RegisterFormValues } from '../schemas/auth.schema';
import { LogoutScope } from '@/common/enums';
import { authMapper } from '../mappers/auth.mapper';

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Khác với web (đi qua Next.js Route Handler proxy để forward Set-Cookie cùng-domain),
 * mobile gọi thẳng backend `API_BASE_URL` — không có proxy ở giữa. Xem TODO trong
 * `lib/auth-refresh.ts` về việc refresh token HttpOnly cookie trên native.
 *
 * Đăng nhập Google/Apple CHƯA tích hợp (backend chưa công bố endpoint OAuth `READY`).
 */
export const authApi = {
  register: async (values: RegisterFormValues): Promise<AuthSession> => {
    const payload = authMapper.toRegisterDto(values);
    const res = await api.post<AuthSessionResponseDto>(API_ENDPOINTS.AUTH.REGISTER, payload);
    return authMapper.toSessionModel(res.data);
  },

  login: async (payload: LoginPayload): Promise<AuthSession> => {
    const body: LoginRequestDto = { email: payload.email, password: payload.password };
    const res = await api.post<AuthSessionResponseDto>(API_ENDPOINTS.AUTH.LOGIN, body);
    return authMapper.toSessionModel(res.data);
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<ProfileResponseDto>(API_ENDPOINTS.USERS.ME);
    return authMapper.toProfileModel(res.data);
  },

  refreshToken: async (): Promise<string> => {
    const res = await api.post<RefreshResponseDto>(API_ENDPOINTS.AUTH.REFRESH, {});
    return authMapper.toRefreshedTokenModel(res.data).accessToken;
  },

  logout: async (opts?: { allDevices?: boolean }): Promise<LogoutResult> => {
    const body: LogoutRequestDto = { allDevices: opts?.allDevices ?? false };
    try {
      const res = await api.post<LogoutResponseDto>(API_ENDPOINTS.AUTH.LOGOUT, body, {
        silent: true,
      });
      return authMapper.toLogoutResultModel(res.data);
    } catch {
      // Backend không tới được vẫn cho logout phía client.
      return {
        loggedOut: true,
        scope: body.allDevices ? LogoutScope.ALL_DEVICES : LogoutScope.CURRENT,
      };
    }
  },
};
