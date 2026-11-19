import { BaseMapper, pickField, safeArray, safeBoolean, safeNumber, safeString } from '@/lib/mapper';
import { toDietSummary } from '@/features/profile/mappers/profile.mapper';
import { dietImpactMapper } from './diet-impact.mapper';
import type { DietPreferenceDto, DietPreferenceResponseDto, DietRulePreviewResponseDto, SaveDietPreferencesRequestDto } from '../types/diet-preferences.dto';
import type { DietPreferenceSummary } from '@/features/profile/types/profile.model';
import type { DietRulePreview, SaveDietPreferencesInput, SavedDietPreferences } from '../types/diet-preferences.model';

export class DietPreferencesMapper extends BaseMapper<DietPreferenceDto, DietPreferenceSummary | null> {
  toModel(dto: DietPreferenceDto | null | undefined): DietPreferenceSummary | null {
    return toDietSummary(dto);
  }
  toPreviewModel(dto: DietRulePreviewResponseDto | null | undefined): DietRulePreview {
    const data = dto?.data;
    return { policyVersion: safeNumber(data?.policyVersion, 1),
      selection: { allowEggs: safeBoolean(data?.selection?.allowEggs), allowDairy: safeBoolean(data?.selection?.allowDairy),
        allowHoney: safeBoolean(data?.selection?.allowHoney), allowFivePungent: safeBoolean(data?.selection?.allowFivePungent) },
      constraints: safeArray<NonNullable<NonNullable<typeof data>['constraints']>[number]>(data?.constraints).map((item) => ({
        code: safeString(item.code), label: safeString(item.label), allowed: safeBoolean(item.allowed),
      })) };
  }
  toSaveDto(input: SaveDietPreferencesInput): SaveDietPreferencesRequestDto {
    return { allowEggs: input.allowEggs, allowDairy: input.allowDairy, allowHoney: input.allowHoney, allowFivePungent: input.allowFivePungent,
      policyVersion: input.policyVersion, expectedDietaryRevision: input.expectedDietaryRevision,
      allergies: input.allergies.map((item) => ({ allergenCode: item.allergenCode, label: item.label || undefined, severity: item.severity })),
      ...(input.ingredientAllergies !== undefined ? { ingredientAllergies: input.ingredientAllergies.map((item) => ({ ingredientId: item.ingredientId, severity: item.severity })) } : {}),
      ingredientExclusions: input.ingredientExclusions.map((item) => ({
        ...(item.ingredientId ? { ingredientId: item.ingredientId } : {}), ingredientName: item.ingredientName.trim(),
        ...(item.reason?.trim() ? { reason: item.reason.trim() } : {}),
      })) };
  }
  toSavedModel(dto: DietPreferenceResponseDto): SavedDietPreferences {
    const preference = toDietSummary(dto.data);
    if (!preference) throw new Error('Phản hồi thiết lập ăn uống không hợp lệ. Hãy tải lại hồ sơ để kiểm tra trạng thái đã lưu.');
    return { preference, impact: dto.data?.impact ? dietImpactMapper.toModel(dto.data.impact) : null,
      impactUnavailable: safeBoolean(pickField(dto.data, ['impactUnavailable'], false)) || !dto.data?.impact };
  }
}
export const dietPreferencesMapper = new DietPreferencesMapper();
