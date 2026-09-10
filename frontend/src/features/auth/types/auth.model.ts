import { UserRole } from '@/common/enums';

/**
 * Domain Entity chuẩn của Frontend: trường dữ liệu rõ ràng, chuẩn camelCase,
 * không bị null/undefined ngoài ý muốn.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date | null;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  user: User | null;
}
