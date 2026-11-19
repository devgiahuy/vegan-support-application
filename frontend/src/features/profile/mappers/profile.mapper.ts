import { BaseMapper, pickField, safeString } from '@/lib/mapper';
import { authMapper } from '@/features/auth/mappers/auth.mapper';
import type { UserDto } from '@/features/auth/types/auth.dto';
import type { ProfileResponseDto, UpdateBasicProfileRequestDto } from '../types/profile.dto';
import type { DetailedProfile, DietPreferenceSummary } from '../types/profile.model';
import { healthMapper } from './health.mapper';
import { formatDate } from '@/lib/utils';
import { dietMapper } from '@/features/diet-preferences/mappers/diet.mapper';

/**
 * ProfileMapper: `GET /users/me` → `DetailedProfile`.
 * Phần user dùng lại `authMapper.toModel`; health/diet map tại đây.
 */
export class ProfileMapper extends BaseMapper<ProfileResponseDto['data'], DetailedProfile> {
  toModel(data: ProfileResponseDto['data']): DetailedProfile {
    const user = authMapper.toModel((data ?? null) as UserDto | null);

    const rawHealth = pickField<Record<string, unknown> | null>(
      data,
      ['healthProfile', 'health_profile'],
      null
    );
    const rawDiet = pickField<Record<string, unknown> | null>(
      data,
      ['dietPreference', 'diet_preference'],
      null
    );

    return {
      user,
      health: healthMapper.toNullableModel(
        rawHealth as Parameters<typeof healthMapper.toNullableModel>[0]
      ),
      diet: toDietSummary(rawDiet),
      memberSince: formatDate(user.createdAt),
    };
  }

  /**
   * Map form cơ bản sang payload PATCH. Chỉ gửi field đã đổi;
   * avatar rỗng → `null` (xóa ảnh).
   */
  toUpdateDto(values: {
    displayName?: string;
    avatarUrl?: string | null;
  }): UpdateBasicProfileRequestDto {
    const dto: UpdateBasicProfileRequestDto = {};
    if (values.displayName !== undefined) dto.displayName = safeString(values.displayName);
    if (values.avatarUrl !== undefined) {
      const url = safeString(values.avatarUrl);
      dto.avatarUrl = url.length > 0 ? url : null;
    }
    return dto;
  }
}

function toDietSummary(
  raw: Record<string, unknown> | null | undefined
): DietPreferenceSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const pref = dietMapper.toPreferenceModel(raw);
  return pref;
}

export const profileMapper = new ProfileMapper();
