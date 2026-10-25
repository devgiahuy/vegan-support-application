import { BaseMapper, pickField, safeArray, safeString } from '@/lib/mapper';
import { authMapper } from '@/features/auth/mappers/auth.mapper';
import type { UserDto } from '@/features/auth/types/auth.dto';
import type { ProfileResponseDto, UpdateBasicProfileRequestDto } from '../types/profile.dto';
import type { DetailedProfile, DietPreferenceSummary } from '../types/profile.model';
import { healthMapper } from './health.mapper';
import { formatDate } from '@/lib/utils';
import { dietMapper } from '@/features/diet-preferences/mappers/diet.mapper';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * ProfileMapper: `GET /users/me` → `DetailedProfile`.
 * Phần user dùng lại `authMapper.toModel`; health/diet map tại đây.
 */
export class ProfileMapper extends BaseMapper<ProfileResponseDto, DetailedProfile> {
  toModel(dto: ProfileResponseDto | null | undefined): DetailedProfile {
    const data = pickField(dto, ['data'], null) as ProfileResponseDto['data'];
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
  const pref = dietMapper.toPreferenceModel({ data: raw });
  const rawSchedule = pickField<Record<string, unknown> | null>(raw, ['schedule'], null);
  const scheduleDates = safeArray<unknown, string>(pickField(rawSchedule, ['dates'], null), (d) =>
    typeof d === 'string' && DATE_RE.test(d) ? d : ''
  ).filter((d) => d.length > 0);
  const scheduleTimezone = safeString(pickField(rawSchedule, ['timezone'], 'Asia/Ho_Chi_Minh'));

  return {
    ...pref,
    scheduleDates: scheduleDates.length > 0 ? scheduleDates : (pref.schedule?.dates ?? []),
    scheduleTimezone: scheduleTimezone || pref.schedule?.timezone || 'Asia/Ho_Chi_Minh',
  };
}

export const profileMapper = new ProfileMapper();
