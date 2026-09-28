import { BaseMapper, pickField, safeArray, safeBoolean, safeEnum, safeNumber, safeString } from '@/lib/mapper';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';
import type { DietRulePreviewItemDto, DietRulePreviewResponseDto } from '../types/diet-preferences.dto';
import type { DietRulePreview, DietRulePreviewItem } from '../types/diet-preferences.model';

export class DietPreferencesMapper extends BaseMapper<DietRulePreviewItemDto, DietRulePreviewItem> {
  toModel(dto: DietRulePreviewItemDto | null | undefined): DietRulePreviewItem {
    return {
      id: safeString(pickField(dto, ['id'], '')),
      code: safeString(pickField(dto, ['code'], '')),
      label: safeString(pickField(dto, ['label'], 'Quy tắc')),
      description: safeString(pickField(dto, ['description'], '')),
      defaultEnabled: safeBoolean(pickField(dto, ['defaultEnabled'], true)),
      hardConstraint: safeBoolean(pickField(dto, ['hardConstraint'], false)),
      source: safeString(pickField(dto, ['source'], '')),
      version: safeNumber(pickField(dto, ['version'], 1)),
    };
  }

  toPreviewModel(dto: DietRulePreviewResponseDto | null | undefined): DietRulePreview {
    const data = pickField<DietRulePreviewResponseDto['data']>(dto, ['data'], null);
    const selection = pickField<NonNullable<DietRulePreviewResponseDto['data']>['selection']>(
      data,
      ['selection'],
      undefined
    );
    return {
      ruleSetVersion: safeNumber(pickField(data, ['ruleSetVersion'], 1)),
      selection: {
        dietPattern: safeEnum(pickField(selection, ['dietPattern'], DietPattern.VEGAN), DietPattern, DietPattern.VEGAN),
        practiceSchedule: safeEnum(
          pickField(selection, ['practiceSchedule'], PracticeSchedule.PERMANENT),
          PracticeSchedule,
          PracticeSchedule.PERMANENT
        ),
        tradition: safeEnum(pickField(selection, ['tradition'], Tradition.NONE), Tradition, Tradition.NONE),
      },
      rules: safeArray<DietRulePreviewItemDto | null, DietRulePreviewItem>(
        pickField(data, ['rules'], []),
        (item) => this.toModel(item)
      ).filter((item) => item.id.length > 0),
    };
  }
}

export const dietPreferencesMapper = new DietPreferencesMapper();
