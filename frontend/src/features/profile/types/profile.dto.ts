import type { UserDto } from '@/features/auth/types/auth.dto';

/**
 * DTO `GET /users/me` → `ProfileResponse` và `PATCH /users/me`.
 * Phần user dùng lại `UserDto` từ auth; health/diet là object thô (mapper mới lo).
 */

/** Toàn bộ `ProfileResponse.data` (health/diet để mapper con xử lý). */
export interface ProfileResponseDto {
  success?: boolean;
  data?:
    | (UserDto & {
        healthProfile?: Record<string, unknown> | null;
        health_profile?: Record<string, unknown> | null;
        dietPreference?: Record<string, unknown> | null;
        diet_preference?: Record<string, unknown> | null;
      })
    | null;
  meta?: null;
}

/** `PATCH /users/me` — cần ít nhất một field (backend 400 nếu rỗng). */
export interface UpdateBasicProfileRequestDto {
  displayName?: string;
  display_name?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
}
