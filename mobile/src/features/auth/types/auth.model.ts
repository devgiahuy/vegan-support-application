import {
  ContributorApplicationStatus,
  ContributorType,
  LogoutScope,
  MemberStatus,
  UserRole,
} from '@/common/enums';

/**
 * Domain Model chuẩn cho auth. UI chỉ nhận các interface này — cấm đọc DTO trực tiếp.
 */

/** Đơn nguyện vọng contributor — chỉ để hiển thị trạng thái, không cấp quyền (BL-01). */
export interface ContributorApplication {
  status: ContributorApplicationStatus;
  /** Chuỗi gốc từ backend để hiển thị an toàn khi status lạ. */
  rawStatus: string;
  requestedType: ContributorType | null;
  requestedTypeLabel: string;
}

/** Người dùng hiện tại. */
export interface User {
  id: string;
  email: string;
  displayName: string;
  /** `''` khi backend trả null — UI tự dùng placeholder/avatar fallback. */
  avatarUrl: string;
  role: UserRole;
  status: MemberStatus;
  createdAt: Date | null;
  contributorApplication: ContributorApplication | null;
  /** 1–2 ký tự đầu của displayName, dùng cho avatar fallback. */
  initials: string;
}

/** Phiên đăng nhập/đăng ký. Refresh token không nằm trong model (HttpOnly cookie). */
export interface AuthSession {
  accessToken: string;
  accessTokenExpiresAt: Date | null;
  user: User;
}

/** Kết quả làm mới access token. */
export interface RefreshedToken {
  accessToken: string;
  accessTokenExpiresAt: Date | null;
}

/** Kết quả đăng xuất. */
export interface LogoutResult {
  loggedOut: boolean;
  scope: LogoutScope;
}
