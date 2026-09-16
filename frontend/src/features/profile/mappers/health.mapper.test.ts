import { describe, expect, it } from 'vitest';
import { healthMapper } from '@/features/profile/mappers/health.mapper';
import { ActivityLevel, BiologicalSex, HealthDataSource } from '@/common/enums';

const FULL = {
  heightCm: 170,
  weightKg: 65,
  age: 30,
  sex: 'MALE',
  activityLevel: 'MODERATELY_ACTIVE',
  bmi: 22.49,
  bmr: 1567.5,
  tdee: 2429.63,
  dataSource: 'MANUAL',
  updatedAt: '2026-09-10T08:00:00.000Z',
};

describe('HealthMapper.toModel', () => {
  it('giữ nguyên số backend, phân loại đúng chuẩn châu Á', () => {
    const h = healthMapper.toModel({ ...FULL });

    expect(h.bmi).toBe(22.49);
    expect(h.bmr).toBe(1567.5);
    expect(h.tdee).toBe(2429.63);
    expect(h.bmiCategory).toBe('Bình thường');
    expect(h.sex).toBe(BiologicalSex.MALE);
    expect(h.sexLabel).toBe('Nam');
    expect(h.activityLevelLabel).toBe('Vận động vừa');
    expect(h.dataSource).toBe(HealthDataSource.MANUAL);
    expect(h.hasAbnormalBmi).toBe(false);
    expect(h.needsDisclaimer).toBe(false);
    expect(h.updatedAt).toBeInstanceOf(Date);
  });

  it('chịu được số dạng chuỗi và ngưỡng cảnh báo biên', () => {
    const low = healthMapper.toModel({ ...FULL, heightCm: '250', weightKg: '30', bmi: '4.8' });
    expect(low.heightCm).toBe(250);
    expect(low.weightKg).toBe(30);
    expect(low.bmi).toBe(4.8);
    expect(low.hasAbnormalBmi).toBe(true);
    expect(low.needsDisclaimer).toBe(true);

    const high = healthMapper.toModel({ ...FULL, bmi: 46 });
    expect(high.hasAbnormalBmi).toBe(true);

    const edge = healthMapper.toModel({ ...FULL, bmi: 16 });
    expect(edge.hasAbnormalBmi).toBe(false);
    expect(edge.needsDisclaimer).toBe(false);

    const edge2 = healthMapper.toModel({ ...FULL, bmi: 15.9 });
    expect(edge2.needsDisclaimer).toBe(true);
  });

  it('enum lạ fallback an toàn', () => {
    const h = healthMapper.toModel({ ...FULL, sex: 'X', activityLevel: 'Y', dataSource: 'Z' });
    expect(h.sex).toBe(BiologicalSex.MALE);
    expect(h.activityLevel).toBe(ActivityLevel.SEDENTARY);
    expect(h.dataSource).toBe(HealthDataSource.MANUAL);
  });

  it('toNullableModel trả null khi chưa có dữ liệu', () => {
    expect(healthMapper.toNullableModel(null)).toBeNull();
    expect(healthMapper.toNullableModel(undefined)).toBeNull();
  });
});

describe('HealthMapper.toCreateDto', () => {
  it('gửi đúng 5 field bắt buộc, age nguyên', () => {
    expect(
      healthMapper.toCreateDto({
        heightCm: 170,
        weightKg: 65.5,
        age: 30.9,
        sex: 'FEMALE' as never,
        activityLevel: 'LIGHTLY_ACTIVE' as never,
      })
    ).toEqual({
      heightCm: 170,
      weightKg: 65.5,
      age: 30,
      sex: 'FEMALE',
      activityLevel: 'LIGHTLY_ACTIVE',
    });
  });
});
