import { describe, expect, it } from 'vitest';
import { dietMapper } from '@/features/diet-preferences/mappers/diet.mapper';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';

const PREVIEW = {
  success: true,
  data: {
    ruleSetVersion: 1,
    selection: { dietPattern: 'VEGAN', practiceSchedule: 'PERIODIC', tradition: 'BUDDHIST' },
    rules: [
      {
        ruleDefinitionId: 'r-1',
        name: 'Không thịt cá',
        source: 'core',
        isDefault: true,
        isHard: true,
        enabled: true,
      },
      {
        ruleDefinitionId: 'r-2',
        name: 'Không trứng sữa',
        source: 'vegan',
        isDefault: true,
        isHard: false,
        enabled: false,
      },
      { ruleDefinitionId: '', name: 'Rác' },
      null,
    ],
  },
  meta: null,
};

describe('DietMapper.toPreviewModel', () => {
  it('giữ ruleSetVersion, lọc rule rỗng ID/null', () => {
    const p = dietMapper.toPreviewModel(PREVIEW);

    expect(p.ruleSetVersion).toBe(1);
    expect(p.selection.dietPattern).toBe(DietPattern.VEGAN);
    expect(p.selection.practiceSchedule).toBe(PracticeSchedule.PERIODIC);
    expect(p.selection.tradition).toBe(Tradition.BUDDHIST);
    expect(p.rules).toHaveLength(2);
    expect(p.rules[0].isHard).toBe(true);
    expect(p.rules[1].enabled).toBe(false);
  });

  it('trả defaults khi dto null', () => {
    const p = dietMapper.toPreviewModel(null);
    expect(p.ruleSetVersion).toBe(0);
    expect(p.rules).toEqual([]);
  });

  it('đọc đúng shape thật của BE (id/label/defaultEnabled/hardConstraint)', () => {
    const p = dietMapper.toPreviewModel({
      success: true,
      data: {
        ruleSetVersion: 1,
        selection: { dietPattern: 'VEGAN', practiceSchedule: 'PERIODIC', tradition: 'BUDDHIST' },
        rules: [
          {
            id: 'f8e7a60a-56d4-467a-99b6-93ed878c02be',
            code: 'DIET_VEGAN_EXCLUDE_ANIMAL_PRODUCTS',
            label: 'Loại trừ sản phẩm có nguồn gốc động vật',
            description: 'Quy tắc bắt buộc.',
            defaultEnabled: true,
            hardConstraint: true,
            source: 'DIET_PATTERN',
            version: 1,
          },
        ],
      },
      meta: null,
    });

    expect(p.rules).toHaveLength(1);
    expect(p.rules[0].ruleDefinitionId).toBe('f8e7a60a-56d4-467a-99b6-93ed878c02be');
    expect(p.rules[0].name).toBe('Loại trừ sản phẩm có nguồn gốc động vật');
    expect(p.rules[0].isDefault).toBe(true);
    expect(p.rules[0].isHard).toBe(true);
    expect(p.rules[0].enabled).toBe(false);
  });
});

describe('DietMapper.toPreferenceModel', () => {
  it('map đủ preference + constraints + lọc ngày sai', () => {
    const pref = dietMapper.toPreferenceModel({
      success: true,
      data: {
        dietPattern: 'LACTO_OVO',
        practiceSchedule: 'PERIODIC',
        tradition: 'NONE',
        ruleSetVersion: 1,
        confirmedAt: '2026-09-12T08:00:00.000Z',
        requiresRuleReview: false,
        rules: [{ ruleDefinitionId: 'r-1', enabled: true }],
        schedule: { timezone: 'Asia/Ho_Chi_Minh', dates: ['2026-09-15', 'not-a-date', null] },
        allergies: [{ allergenCode: 'PEANUT', label: 'Đậu phộng', severity: 'HIGH' }],
        ingredientExclusions: [
          { ingredientId: null, ingredientName: 'Mắm tôm', reason: '' },
          { ingredientName: '' },
        ],
        effectiveConstraints: { always: ['no-meat', ''], scheduledTradition: null },
      },
      meta: null,
    });

    expect(pref.dietPatternLabel).toBe('Có trứng sữa');
    expect(pref.schedule?.dates).toEqual(['2026-09-15']);
    expect(pref.allergies).toHaveLength(1);
    expect(pref.ingredientExclusions).toHaveLength(1);
    expect(pref.effectiveConstraints.always).toEqual(['no-meat']);
    expect(pref.effectiveConstraints.scheduledTradition).toBeNull();
  });
});

describe('DietMapper.toScheduleModel', () => {
  it('lọc ngày sai định dạng', () => {
    const s = dietMapper.toScheduleModel({
      success: true,
      data: {
        practiceSchedule: 'PERIODIC',
        timezone: 'Asia/Ho_Chi_Minh',
        dates: ['2026-09-15', '15/09/2026'],
      },
      meta: null,
    });
    expect(s.dates).toEqual(['2026-09-15']);
    expect(s.timezone).toBe('Asia/Ho_Chi_Minh');
  });
});

describe('DietMapper.toSaveDto / toScheduleDto', () => {
  it('loại rule rỗng ID, giữ đủ rule đã preview', () => {
    const dto = dietMapper.toSaveDto({
      dietPattern: 'VEGAN',
      practiceSchedule: 'PERMANENT',
      tradition: 'NONE',
      ruleSetVersion: 1,
      rules: [
        {
          ruleDefinitionId: 'r-1',
          name: 'A',
          source: '',
          isDefault: true,
          isHard: true,
          enabled: true,
        },
        {
          ruleDefinitionId: '',
          name: 'Rác',
          source: '',
          isDefault: false,
          isHard: false,
          enabled: true,
        },
      ],
      allergies: [],
      ingredientExclusions: [],
    });
    expect(dto.rules).toEqual([{ ruleDefinitionId: 'r-1', enabled: true }]);
  });

  it('toScheduleDto lọc ngày sai', () => {
    expect(dietMapper.toScheduleDto(['2026-09-15', 'abc'])).toEqual({ dates: ['2026-09-15'] });
  });

  it('toSaveDto chuẩn hóa severity dị ứng về MILD|MODERATE|SEVERE', () => {
    const dto = dietMapper.toSaveDto({
      dietPattern: 'VEGAN',
      practiceSchedule: 'PERMANENT',
      tradition: 'NONE',
      ruleSetVersion: 1,
      rules: [],
      allergies: [
        { allergenCode: 'PEANUT', label: 'Đậu phộng', severity: 'severe' },
        { allergenCode: 'MILK', label: 'Sữa', severity: '' },
        { allergenCode: '', label: 'Rác', severity: 'MILD' },
      ],
      ingredientExclusions: [],
    });
    expect(dto.allergies).toEqual([
      { allergenCode: 'PEANUT', label: 'Đậu phộng', severity: 'SEVERE' },
      { allergenCode: 'MILK', label: 'Sữa', severity: 'MODERATE' },
    ]);
  });
});
