import type { UserDto } from '@/features/auth/types/auth.dto';

export interface ProfileResponseDto {
  success?: boolean;
  data?: (UserDto & {
    healthProfile?: Record<string, unknown> | null;
    health_profile?: Record<string, unknown> | null;
    dietPreference?: Record<string, unknown> | null;
    diet_preference?: Record<string, unknown> | null;
  }) | null;
  meta?: null;
}

export interface UpdateBasicProfileRequestDto {
  displayName?: string;
  avatarUrl?: string | null;
}

