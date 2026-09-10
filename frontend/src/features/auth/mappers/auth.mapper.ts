import { BaseMapper, pickField, safeBoolean, safeDate, safeEnum, safeString } from '@/lib/mapper';
import { UserDto, LoginResponseDto } from '../types/auth.dto';
import { User, AuthSession } from '../types/auth.model';
import { UserRole } from '@/common/enums';

/**
 * AuthMapper bảo vệ Frontend khi Backend thay đổi trường tài khoản người dùng
 */
export class AuthMapper extends BaseMapper<UserDto, User> {
  toModel(dto: UserDto | null | undefined): User {
    const id = safeString(pickField(dto, ['id', '_id', 'userId'], ''));
    const email = safeString(pickField(dto, ['email', 'user_email'], ''));
    const name = safeString(pickField(dto, ['name', 'full_name', 'username'], 'Người dùng'));
    const avatar = safeString(
      pickField(dto, ['avatarUrl', 'avatar_url', 'avatar'], '/avatar-default.jpg')
    );
    const role = safeEnum(
      pickField(dto, ['role', 'user_role'], 'USER'),
      UserRole,
      UserRole.USER
    );
    const isActive = safeBoolean(pickField(dto, ['is_active', 'isActive', 'status'], true));
    const createdAt = safeDate(pickField(dto, ['createdAt', 'created_at'], null));

    return {
      id,
      email,
      name,
      avatar,
      role,
      isActive,
      createdAt,
    };
  }

  toSessionModel(dto: LoginResponseDto | null | undefined): AuthSession {
    const token = safeString(pickField(dto, ['accessToken', 'access_token', 'token'], ''));
    const refreshToken = safeString(
      pickField(dto, ['refreshToken', 'refresh_token'], '')
    );
    const rawUser = pickField<UserDto | undefined>(dto, ['user', 'userInfo', 'data'], undefined);

    return {
      token,
      refreshToken,
      user: rawUser ? this.toModel(rawUser) : null,
    };
  }
}

export const authMapper = new AuthMapper();
