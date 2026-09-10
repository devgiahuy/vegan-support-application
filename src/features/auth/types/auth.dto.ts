/**
 * DTO dữ liệu thô trả về từ Backend (thường có thể thay đổi giữa các phiên bản API)
 */
export interface UserDto {
  // Backend có thể đổi giữa 'id' hoặc '_id' hoặc 'userId'
  id?: string | number;
  _id?: string;
  userId?: string | number;

  // Backend có thể đổi giữa 'email' hoặc 'user_email'
  email?: string;
  user_email?: string;

  // Backend có thể đổi giữa 'full_name', 'name', 'userName'
  full_name?: string;
  name?: string;
  username?: string;

  // Avatar
  avatar_url?: string;
  avatarUrl?: string;
  avatar?: string;

  // Role
  role?: string;
  user_role?: string;

  // Status
  is_active?: boolean | number;
  status?: string | number;

  created_at?: string;
  createdAt?: string;
}

export interface LoginResponseDto {
  access_token?: string;
  accessToken?: string;
  token?: string;
  refresh_token?: string;
  refreshToken?: string;
  user?: UserDto;
  userInfo?: UserDto;
  data?: UserDto;
}
