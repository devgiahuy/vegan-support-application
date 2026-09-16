import {
  BaseMapper,
  pickField,
  safeArray,
  safeBoolean,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type {
  DietPreferenceResponseDto,
  DietRuleDto,
  DietRulePreviewResponseDto,
  DietScheduleResponseDto,
  SaveDietPreferencesRequestDto,
  UpdateDietScheduleRequestDto,
} from '../types/diet.dto';
import type {
  Allergy,
  DietPreference,
  DietPreview,
  DietRule,
  DietSchedule,
  IngredientExclusion,
} from '../types/diet.model';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

/**
 * DietMapper: preview/preferences/schedule → Model sạch cho UI.
 * `ruleSetVersion` + đủ `rules[]` được giữ nguyên để gửi lại khi save.
 */
export class DietMapper extends BaseMapper<DietRuleDto, DietRule> {
  toModel(dto: DietRuleDto | null | undefined): DietRule {
    return {
      ruleDefinitionId: safeString(
        pickField(dto, ['ruleDefinitionId', 'rule_definition_id', 'id'], '')
      ),
      // Shape thật từ BE (`POST /diet-rules/preview`): `{id, code, label, description,
      // defaultEnabled, hardConstraint, source, version}` — đã verify bằng contract test 2026-09-15.
      name: safeString(pickField(dto, ['name', 'label', 'rule_name', 'title'], 'Quy tắc')),
      source: safeString(pickField(dto, ['source', 'ruleSource', 'rule_source'], '')),
      isDefault: safeBoolean(pickField(dto, ['isDefault', 'is_default', 'defaultEnabled'], false)),
      isHard: safeBoolean(
        pickField(
          dto,
          ['isHard', 'is_hard', 'hardConstraint', 'hard_constraint', 'hard', 'required'],
          false
        )
      ),
      enabled: safeBoolean(pickField(dto, ['enabled', 'isEnabled'], false)),
    };
  }

  /** `POST /diet-rules/preview` → `DietPreview`. */
  toPreviewModel(dto: DietRulePreviewResponseDto | null | undefined): DietPreview {
    const data = pickField(dto, ['data'], null) as DietRulePreviewResponseDto['data'];
    const selection = pickField(data, ['selection'], null) as {
      dietPattern?: string;
      practiceSchedule?: string;
      tradition?: string;
    } | null;
    return {
      ruleSetVersion: safeNumber(pickField(data, ['ruleSetVersion', 'rule_set_version'], 0)),
      selection: {
        dietPattern: safeEnum(
          pickField(selection, ['dietPattern', 'diet_pattern'], DietPattern.VEGAN),
          DietPattern,
          DietPattern.VEGAN
        ),
        practiceSchedule: safeEnum(
          pickField(
            selection,
            ['practiceSchedule', 'practice_schedule'],
            PracticeSchedule.PERMANENT
          ),
          PracticeSchedule,
          PracticeSchedule.PERMANENT
        ),
        tradition: safeEnum(
          pickField(selection, ['tradition'], Tradition.NONE),
          Tradition,
          Tradition.NONE
        ),
      },
      rules: this.toModelList(
        safeArray<DietRuleDto | null, DietRuleDto | null>(
          pickField(data, ['rules'], null),
          (r) => r
        )
      ).filter((r) => r.ruleDefinitionId.length > 0),
    };
  }

  /** `PUT /users/me/diet-preferences` → `DietPreference`. */
  toPreferenceModel(dto: DietPreferenceResponseDto | null | undefined): DietPreference {
    const data = (pickField(dto, ['data'], null) ?? {}) as Record<string, unknown>;
    const pattern = safeEnum(
      pickField(data, ['dietPattern', 'diet_pattern'], DietPattern.VEGAN),
      DietPattern,
      DietPattern.VEGAN
    );
    const schedule = safeEnum(
      pickField(data, ['practiceSchedule', 'practice_schedule'], PracticeSchedule.PERMANENT),
      PracticeSchedule,
      PracticeSchedule.PERMANENT
    );
    const tradition = safeEnum(
      pickField(data, ['tradition'], Tradition.NONE),
      Tradition,
      Tradition.NONE
    );
    const rawSchedule = pickField<Record<string, unknown> | null>(data, ['schedule'], null);
    const rawConstraints = pickField<Record<string, unknown> | null>(
      data,
      ['effectiveConstraints', 'effective_constraints'],
      null
    );

    return {
      dietPattern: pattern,
      dietPatternLabel: PATTERN_LABELS[pattern],
      practiceSchedule: schedule,
      practiceScheduleLabel: SCHEDULE_LABELS[schedule],
      tradition,
      traditionLabel: TRADITION_LABELS[tradition],
      ruleSetVersion: safeNumber(pickField(data, ['ruleSetVersion', 'rule_set_version'], 0)),
      confirmedAt: safeDate(pickField(data, ['confirmedAt', 'confirmed_at'], null)),
      requiresRuleReview: safeBoolean(
        pickField(data, ['requiresRuleReview', 'requires_rule_review'], false)
      ),
      rules: safeArray<unknown, DietRule | null>(pickField(data, ['rules'], null), (r) =>
        typeof r === 'object' && r !== null ? this.toModel(r as DietRuleDto) : null
      ).filter((r): r is DietRule => r !== null && r.ruleDefinitionId.length > 0),
      schedule: rawSchedule
        ? {
            timezone: safeString(pickField(rawSchedule, ['timezone'], 'Asia/Ho_Chi_Minh')),
            dates: safeArray<unknown, string>(pickField(rawSchedule, ['dates'], null), (d) =>
              typeof d === 'string' && DATE_RE.test(d) ? d : ''
            ).filter((d) => d.length > 0),
          }
        : null,
      allergies: safeArray<unknown, Allergy>(pickField(data, ['allergies'], null), (a) =>
        toAllergy(a)
      ),
      ingredientExclusions: safeArray<unknown, IngredientExclusion>(
        pickField(data, ['ingredientExclusions', 'ingredient_exclusions'], null),
        (e) => toExclusion(e)
      ).filter((e) => e.ingredientName.length > 0),
      effectiveConstraints: {
        always: safeArray<unknown, string>(pickField(rawConstraints, ['always'], null), (v) =>
          typeof v === 'string' ? v : ''
        ).filter((v) => v.length > 0),
        scheduledTradition:
          safeString(
            pickField(rawConstraints, ['scheduledTradition', 'scheduled_tradition'], null)
          ) || null,
      },
    };
  }

  /** `PUT /users/me/diet-schedule` → `DietSchedule`. */
  toScheduleModel(dto: DietScheduleResponseDto | null | undefined): DietSchedule {
    const data = pickField(dto, ['data'], null) as DietScheduleResponseDto['data'];
    return {
      practiceSchedule: safeEnum(
        pickField(data, ['practiceSchedule', 'practice_schedule'], PracticeSchedule.PERIODIC),
        PracticeSchedule,
        PracticeSchedule.PERIODIC
      ),
      timezone: safeString(pickField(data, ['timezone'], 'Asia/Ho_Chi_Minh')),
      dates: safeArray<unknown, string>(pickField(data, ['dates'], null), (d) =>
        typeof d === 'string' && DATE_RE.test(d) ? d : ''
      ).filter((d) => d.length > 0),
    };
  }

  /** Dựng payload save từ preview + lựa chọn user. Loại rule rỗng ID. */
  toSaveDto(input: {
    dietPattern: string;
    practiceSchedule: string;
    tradition: string;
    ruleSetVersion: number;
    rules: DietRule[];
    scheduleDates?: string[];
    allergies?: Allergy[];
    ingredientExclusions?: IngredientExclusion[];
  }): SaveDietPreferencesRequestDto {
    return {
      dietPattern: input.dietPattern,
      practiceSchedule: input.practiceSchedule,
      tradition: input.tradition,
      ruleSetVersion: input.ruleSetVersion,
      rules: input.rules
        .filter((r) => r.ruleDefinitionId.length > 0)
        .map((r) => ({ ruleDefinitionId: r.ruleDefinitionId, enabled: r.enabled })),
      scheduleDates: (input.scheduleDates ?? []).filter((d) => DATE_RE.test(d)),
      allergies: (input.allergies ?? [])
        .filter((a) => a.allergenCode.trim().length > 0)
        .map((a) => ({
          allergenCode: a.allergenCode,
          label: a.label,
          // Backend chỉ nhận MILD|MODERATE|SEVERE — chuẩn hóa, mặc định MODERATE.
          severity: ['MILD', 'MODERATE', 'SEVERE'].includes(a.severity?.toUpperCase?.() ?? '')
            ? (a.severity.toUpperCase() as 'MILD' | 'MODERATE' | 'SEVERE')
            : 'MODERATE',
        })),
      ingredientExclusions: (input.ingredientExclusions ?? [])
        .filter((e) => e.ingredientName.trim().length > 0)
        .map((e) => ({
          ...(e.ingredientId ? { ingredientId: e.ingredientId } : {}),
          ingredientName: e.ingredientName.trim(),
          reason: e.reason,
        })),
    };
  }

  toScheduleDto(dates: string[]): UpdateDietScheduleRequestDto {
    return { dates: dates.filter((d) => DATE_RE.test(d)) };
  }
}

function toAllergy(raw: unknown): Allergy {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const code = safeString(pickField(o, ['allergenCode', 'allergen_code', 'code'], ''));
  return {
    allergenCode: code,
    label: safeString(pickField(o, ['label', 'name'], code)),
    severity: safeString(pickField(o, ['severity'], '')),
  };
}

function toExclusion(raw: unknown): IngredientExclusion {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    ingredientId: safeString(pickField(o, ['ingredientId', 'ingredient_id'], null)) || null,
    ingredientName: safeString(pickField(o, ['ingredientName', 'ingredient_name', 'name'], '')),
    reason: safeString(pickField(o, ['reason'], '')),
  };
}

export const dietMapper = new DietMapper();
