import type {
  AdminModerationUserListResponseDto,
  AdminModerationUserResponseDto,
} from '../types/moderation.dto';

/** Fixture quản trị user (phase scaffold). */
export const moderationUsersFixture: AdminModerationUserListResponseDto = {
  success: true,
  data: [
    {
      id: 'u-violator',
      email: 'violator@example.com',
      displayName: 'Spam Bot',
      role: 'MEMBER',
      status: 'ACTIVE',
      isProtectedAdmin: false,
      reportCount: 5,
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'u-root',
      email: 'root@example.com',
      displayName: 'Quản trị gốc',
      role: 'ADMIN',
      status: 'ACTIVE',
      isProtectedAdmin: true,
      reportCount: 0,
      createdAt: '2026-01-01T08:00:00.000Z',
    },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

export function updatedUserFixture(id: string, status: string): AdminModerationUserResponseDto {
  return {
    success: true,
    data: { id, status, updatedAt: new Date().toISOString() },
    meta: null,
  };
}
