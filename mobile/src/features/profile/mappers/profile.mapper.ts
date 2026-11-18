import {
  BaseMapper,
  pickField,
  safeArray,
  safeBoolean,
  safeDate,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type { DietPreferenceDto } from '@/features/diet-preferences/types/diet-preferences.dto';
import { authMapper } from '@/features/auth/mappers/auth.mapper';
import type { UserDto } from '@/features/auth/types/auth.dto';
import { formatDate } from '@/lib/utils';
import { healthMapper } from './health.mapper';
import type { ProfileResponseDto, UpdateBasicProfileRequestDto } from '../types/profile.dto';
import type {
  AllergySummary,
  DetailedProfile,
  DietPreferenceSummary,
  IngredientAllergySummary,
  IngredientExclusionSummary,
} from '../types/profile.model';

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
      health: healthMapper.toNullableModel(rawHealth as Parameters<typeof healthMapper.toNullableModel>[0]),
      diet: toDietSummary(rawDiet),
      memberSince: formatDate(user.createdAt),
    };
  }

  toUpdateDto(values: { displayName?: string; avatarUrl?: string | null }): UpdateBasicProfileRequestDto {
    const dto: UpdateBasicProfileRequestDto = {};
    if (values.displayName !== undefined) dto.displayName = safeString(values.displayName);
    if (values.avatarUrl !== undefined) {
      const avatarUrl = safeString(values.avatarUrl);
      dto.avatarUrl = avatarUrl.length > 0 ? avatarUrl : null;
    }
    return dto;
  }
}

/** Dùng lại cho response `PUT /users/me/diet-preferences` — cùng shape `dietPreferenceSchema`. */
export function toDietSummary(raw: DietPreferenceDto | Record<string, unknown> | null | undefined): DietPreferenceSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.allowEggs !== 'boolean' || typeof raw.allowDairy !== 'boolean' ||
    typeof raw.allowHoney !== 'boolean' || typeof raw.allowFivePungent !== 'boolean' ||
    safeNumber(raw.dietaryRevision) <= 0) return null;
  return {
    allowEggs: raw.allowEggs,
    allowDairy: raw.allowDairy,
    allowHoney: raw.allowHoney,
    allowFivePungent: raw.allowFivePungent,
    policyVersion: safeNumber(raw.policyVersion, 1),
    dietaryRevision: safeNumber(raw.dietaryRevision),
    requiresRuleReview: safeBoolean(raw.requiresRuleReview),
    confirmedAt: safeDate(raw.confirmedAt),
    allergies: safeArray<unknown, AllergySummary>(pickField(raw, ['allergies'], null), (allergy) => {
      const source = allergy as Record<string, unknown>;
      const code = safeString(pickField(source, ['allergenCode', 'allergen_code', 'code'], ''));
      return {
        allergenCode: code,
        label: safeString(pickField(source, ['label'], code || 'Dị ứng')),
        severity: safeString(pickField(source, ['severity'], 'MODERATE')),
      };
    }).filter((allergy) => allergy.allergenCode.length > 0),
    ingredientAllergies: safeArray<unknown, IngredientAllergySummary>(
      pickField(raw, ['ingredientAllergies', 'ingredient_allergies'], null),
      (entry) => {
        const source = entry as Record<string, unknown>;
        return {
          ingredientId: safeString(pickField(source, ['ingredientId', 'ingredient_id'], '')),
          ingredientName: safeString(pickField(source, ['ingredientName', 'ingredient_name'], '')),
          severity: safeString(pickField(source, ['severity'], 'MODERATE')),
          ingredientActive: safeBoolean(pickField(source, ['ingredientActive', 'ingredient_active'], true), true),
        };
      }
    ).filter((entry) => entry.ingredientId.length > 0),
    ingredientExclusions: safeArray<unknown, IngredientExclusionSummary & { active: boolean }>(
      pickField(raw, ['ingredientExclusions', 'ingredient_exclusions'], null),
      (entry) => {
        const source = entry as Record<string, unknown>;
        const reason = safeString(pickField(source, ['reason'], ''));
        return {
          ingredientId: safeString(pickField(source, ['ingredientId', 'ingredient_id'], '')) || null,
          ingredientName: safeString(pickField(source, ['ingredientName', 'ingredient_name'], '')),
          reason: reason.length > 0 ? reason : null,
          active: safeBoolean(pickField(source, ['active'], true), true),
        };
      }
    )
      .filter((entry) => entry.active && entry.ingredientName.length > 0)
      .map(({ ingredientId, ingredientName, reason }) => ({ ingredientId, ingredientName, reason })),
  };
}

export const profileMapper = new ProfileMapper();
