import {
  BaseMapper,
  pickField,
  safeArray,
  safeBoolean,
  safeDate,
  safeEnum,
  safeString,
} from '@/lib/mapper';
import { authMapper } from '@/features/auth/mappers/auth.mapper';
import type { UserDto } from '@/features/auth/types/auth.dto';
import type { ProfileResponseDto, UpdateBasicProfileRequestDto } from '../types/profile.dto';
import type { DetailedProfile, DietPreferenceSummary } from '../types/profile.model';
import { healthMapper } from './health.mapper';
import { formatDate } from '@/lib/utils';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';

const PATTERN_LABELS: Record<DietPattern, string> = {
  [DietPattern.VEGAN]: 'Thuần chay',
  [DietPattern.LACTO_OVO]: 'Có trứng sữa',
};

const SCHEDULE_LABELS: Record<PracticeSchedule, string> = {
  [PracticeSchedule.PERMANENT]: 'Trường chay',
  [PracticeSchedule.PERIODIC]: 'Chay kỳ',
};

const TRADITION_LABELS: Record<Tradition, string> = {
  [Tradition.NONE]: 'Không theo truyền thống',
  [Tradition.BUDDHIST]: 'Phật giáo',
  [Tradition.CHRISTIAN]: 'Kitô giáo',
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * ProfileMapper: `GET /users/me` → `DetailedProfile`.
 * Phần user dùng lại `authMapper.toModel`; health/diet tóm tắt map tại đây.
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
  const pattern = safeEnum(
    pickField(raw, ['dietPattern', 'diet_pattern'], DietPattern.VEGAN),
    DietPattern,
    DietPattern.VEGAN
  );
  const schedule = safeEnum(
    pickField(raw, ['practiceSchedule', 'practice_schedule'], PracticeSchedule.PERMANENT),
    PracticeSchedule,
    PracticeSchedule.PERMANENT
  );
  const tradition = safeEnum(
    pickField(raw, ['tradition'], Tradition.NONE),
    Tradition,
    Tradition.NONE
  );
  const rawSchedule = pickField<Record<string, unknown> | null>(raw, ['schedule'], null);
  return {
    dietPattern: pattern,
    dietPatternLabel: PATTERN_LABELS[pattern],
    practiceSchedule: schedule,
    practiceScheduleLabel: SCHEDULE_LABELS[schedule],
    tradition,
    traditionLabel: TRADITION_LABELS[tradition],
    requiresRuleReview: safeBoolean(
      pickField(raw, ['requiresRuleReview', 'requires_rule_review'], false)
    ),
    confirmedAt: safeDate(pickField(raw, ['confirmedAt', 'confirmed_at'], null)),
    scheduleDates: safeArray<unknown, string>(pickField(rawSchedule, ['dates'], null), (d) =>
      typeof d === 'string' && DATE_RE.test(d) ? d : ''
    ).filter((d) => d.length > 0),
    scheduleTimezone: safeString(pickField(rawSchedule, ['timezone'], 'Asia/Ho_Chi_Minh')),
  };
}

export const profileMapper = new ProfileMapper();
