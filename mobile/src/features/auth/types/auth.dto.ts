/**
 * DTO dữ liệu thô từ Backend theo OpenAPI (`backend/openapi.json`, tag `auth`/`users`).
 * Mọi DTO đều optional/union-compatible: mapper phải dùng `pickField` + `safe*` cho mọi field.
 * Refresh token KHÔNG nằm trong body — backend chỉ đặt HttpOnly cookie (xem `lib/auth-refresh.ts`).
 */

/** User thô như backend trả trong `AuthSessionResponse.data.user` / `ProfileResponse.data`. */
export interface UserDto {
  id?: string;
  email?: string;
  displayName?: string;
  display_name?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  role?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  contributorApplication?: ContributorApplicationDto | null;
  contributor_application?: ContributorApplicationDto | null;
  contributorProfile?: ContributorProfileDto | null;
  contributor_profile?: ContributorProfileDto | null;
}

/** Đơn nguyện vọng contributor thô (chỉ để hiển thị, không cấp quyền). Phase 14 contract. */
export interface ContributorApplicationDto {
  status?: string;
  claimedApprovalBasis?: string;
  claimed_approval_basis?: string;
}

/** Hồ sơ Contributor đã được duyệt (chỉ hiển thị căn cứ duyệt, không phải cấp quyền). */
export interface ContributorProfileDto {
  approvalBasis?: string;
  approval_basis?: string;
  approvalBasisLabel?: string;
  approval_basis_label?: string;
  approvedAt?: string;
  approved_at?: string;
}

/** `POST /auth/register` + `POST /auth/login` → `201/200 AuthSessionResponse`. */
export interface AuthSessionResponseDto {
  success?: boolean;
  data?: {
    user?: UserDto | null;
    accessToken?: string;
    access_token?: string;
    accessTokenExpiresAt?: string;
    access_token_expires_at?: string;
  } | null;
  meta?: null;
}

/** `POST /auth/refresh` → `200 RefreshResponse`. */
export interface RefreshResponseDto {
  success?: boolean;
  data?: {
    accessToken?: string;
    access_token?: string;
    accessTokenExpiresAt?: string;
    access_token_expires_at?: string;
  } | null;
  meta?: null;
}

/** `POST /auth/logout` → `200 LogoutResponse`. */
export interface LogoutResponseDto {
  success?: boolean;
  data?: {
    loggedOut?: boolean;
    scope?: string;
  } | null;
  meta?: null;
}

/** `GET /users/me` → `200 ProfileResponse`. Chỉ map 8 field user; phần `healthProfile`/
 * `dietPreference` thuộc feature khác (ngoài scope module auth). */
export interface ProfileResponseDto {
  success?: boolean;
  data?: (UserDto & Record<string, unknown>) | null;
  meta?: null;
}

/** Nguyện vọng contributor gửi kèm khi đăng ký (optional). Phase 14 contract:
 * body `.strict()` phía backend — chỉ gửi `organizationClaim` khi basis là
 * `ORGANIZATION_AFFILIATION`, tuyệt đối không gửi field lạ. */
export interface ContributorRequestDto {
  claimedApprovalBasis: string;
  organizationClaim?: string;
  experience: string;
  referenceLinks?: string[];
}

/** `POST /auth/register` request. */
export interface RegisterRequestDto {
  email: string;
  password: string;
  displayName: string;
  contributorRequest?: ContributorRequestDto;
}

/** `POST /auth/login` request. Schema backend chỉ có 2 field — không có CAPTCHA. */
export interface LoginRequestDto {
  email: string;
  password: string;
}

/** `POST /auth/logout` request. Mặc định CURRENT khi không gửi. */
export interface LogoutRequestDto {
  allDevices?: boolean;
}
