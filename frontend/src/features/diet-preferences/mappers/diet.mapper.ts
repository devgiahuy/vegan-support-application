import {
  BaseMapper,
  pickField,
  safeArray,
  safeString,
  safeNumber,
  safeBoolean,
  safeDate,
} from '@/lib/mapper';
import type {
  PreferenceDto,
  DietRulePreviewResponseDto,
  SaveDietPreferencesRequestDto,
} from '../types/diet.dto';
import type { DietPreference, DietPreferenceDraft, DietPreview } from '../types/diet.model';
import type { FoodAllowances } from '../types/food-allowances.model';
import { dietImpactMapper } from './diet-impact.mapper';

const array = <T>(value: T[] | null | undefined): NonNullable<T>[] =>
  safeArray<T>(value).filter((item): item is NonNullable<T> => item != null);

const allowanceKeys = ['allowEggs', 'allowDairy', 'allowHoney', 'allowFivePungent'] as const;
function allowances(data: Partial<FoodAllowances> | null | undefined): FoodAllowances {
  return {
    allowEggs: safeBoolean(pickField(data, ['allowEggs'], false)),
    allowDairy: safeBoolean(pickField(data, ['allowDairy'], false)),
    allowHoney: safeBoolean(pickField(data, ['allowHoney'], false)),
    allowFivePungent: safeBoolean(pickField(data, ['allowFivePungent'], false)),
  };
}
function severity(value: string): 'MILD' | 'MODERATE' | 'SEVERE' {
  const normalized = value.toUpperCase();
  return normalized === 'MILD' || normalized === 'SEVERE' ? normalized : 'MODERATE';
}
export class DietMapper extends BaseMapper<PreferenceDto, DietPreference> {
  toModel(data: PreferenceDto | null | undefined): DietPreference {
    return {
      ...allowances(data),
      selectionValid: allowanceKeys.every((key) => typeof data?.[key] === 'boolean'),
      policyVersion: safeNumber(pickField(data, ['policyVersion'], 0)),
      dietaryRevision: safeNumber(pickField(data, ['dietaryRevision'], 0)),
      confirmedAt: safeDate(pickField(data, ['confirmedAt'], null)),
      requiresRuleReview: safeBoolean(pickField(data, ['requiresRuleReview'], false)),
      allergies: array(data?.allergies)
        .filter((item) => item && item.active !== false)
        .map((item) => ({
          allergenCode: safeString(item.allergenCode),
          label: safeString(item.label, item.allergenCode ?? ''),
          severity: safeString(item.severity, 'MODERATE'),
        })),
      ingredientAllergies: array(data?.ingredientAllergies)
        .filter((item) => item && item.ingredientId)
        .map((item) => ({
          ingredientId: safeString(item.ingredientId),
          ingredientName: safeString(item.ingredientName),
          severity: safeString(item.severity, 'MODERATE'),
          ingredientActive: safeBoolean(item.ingredientActive),
        })),
      ingredientExclusions: array(data?.ingredientExclusions)
        .filter((item) => item && item.active !== false)
        .map((item) => ({
          ingredientId: safeString(item.ingredientId) || null,
          ingredientName: safeString(item.ingredientName),
          reason: safeString(item.reason),
        })),
      effectiveConstraints: {
        always: array(data?.effectiveConstraints?.always)
          .filter(Boolean)
          .map((item) => safeString(item.label, item.code ?? '')),
      },
      ...(data?.impact ? { impact: dietImpactMapper.impact(data.impact) } : {}),
      impactUnavailable: safeBoolean(data?.impactUnavailable),
    };
  }
  toPreferenceModel(data: PreferenceDto | null | undefined): DietPreference {
    return this.toModel(data);
  }
  toPreviewModel(data: DietRulePreviewResponseDto['data']): DietPreview {
    return {
      policyVersion: safeNumber(data?.policyVersion),
      selection: allowances(data?.selection),
      constraints: array(data?.constraints)
        .filter(Boolean)
        .map((item) => ({
          code: safeString(item.code),
          label: safeString(item.label),
          allowed: safeBoolean(item.allowed),
        })),
    };
  }
  toSaveDto(input: DietPreferenceDraft): SaveDietPreferencesRequestDto {
    return {
      ...allowances(input),
      policyVersion: input.policyVersion,
      expectedDietaryRevision: input.expectedDietaryRevision,
      allergies: input.allergies.map((item) => ({
        allergenCode: item.allergenCode,
        label: item.label,
        severity: severity(item.severity),
      })),
      ...(input.ingredientAllergies === undefined
        ? {}
        : {
            ingredientAllergies: input.ingredientAllergies.map((item) => ({
              ingredientId: item.ingredientId,
              severity: severity(item.severity),
            })),
          }),
      ingredientExclusions: input.ingredientExclusions.map((item) => ({
        ...(item.ingredientId ? { ingredientId: item.ingredientId } : {}),
        ingredientName: item.ingredientName.trim(),
        ...(item.reason.trim() ? { reason: item.reason.trim() } : {}),
      })),
    };
  }
}
export const dietMapper = new DietMapper();
