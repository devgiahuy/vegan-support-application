import {
  BaseBidirectionalMapper,
  pickField,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import { calcBmi } from '@/features/health/lib/bmi';
import type { HealthProfileDto, HealthProfileRequestDto } from '../types/health.dto';
import type { HealthProfile } from '../types/health.model';
import { ActivityLevel, BiologicalSex, HealthDataSource } from '@/common/enums';

const SEX_LABELS: Record<BiologicalSex, string> = {
  [BiologicalSex.MALE]: 'Nam',
  [BiologicalSex.FEMALE]: 'Nữ',
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  [ActivityLevel.SEDENTARY]: 'Ít vận động',
  [ActivityLevel.LIGHTLY_ACTIVE]: 'Vận động nhẹ',
  [ActivityLevel.MODERATELY_ACTIVE]: 'Vận động vừa',
  [ActivityLevel.VERY_ACTIVE]: 'Vận động nhiều',
  [ActivityLevel.EXTRA_ACTIVE]: 'Vận động rất nhiều',
};

/**
 * HealthMapper: `PUT /users/me/health-profile` → `HealthProfile`.
 * Số `bmi`/`bmr`/`tdee` giữ nguyên backend trả; phân loại/cảnh báo derived qua `calcBmi`.
 * DTO null → Model defaults (`bmi: 0`, category 'Chưa có dữ liệu'); caller tự quyết
 * `null` (chưa nhập) bằng `toNullableModel`.
 */
export class HealthMapper extends BaseBidirectionalMapper<
  HealthProfileDto,
  HealthProfile,
  HealthProfileRequestDto,
  Partial<HealthProfileRequestDto>
> {
  toModel(dto: HealthProfileDto | null | undefined): HealthProfile {
    const heightCm = safeNumber(pickField(dto, ['heightCm', 'height_cm'], 0));
    const weightKg = safeNumber(pickField(dto, ['weightKg', 'weight_kg'], 0));
    const age = safeNumber(pickField(dto, ['age'], 0));
    const sex = safeEnum(pickField(dto, ['sex'], 'MALE'), BiologicalSex, BiologicalSex.MALE);
    const activityLevel = safeEnum(
      pickField(dto, ['activityLevel', 'activity_level'], 'SEDENTARY'),
      ActivityLevel,
      ActivityLevel.SEDENTARY
    );
    const bmi = safeNumber(pickField(dto, ['bmi'], 0));
    const hasData = heightCm > 0 && weightKg > 0 && bmi > 0;
    const category = hasData ? calcBmi(weightKg, heightCm).category : 'Chưa có dữ liệu';

    return {
      heightCm,
      weightKg,
      age,
      sex,
      sexLabel: SEX_LABELS[sex],
      activityLevel,
      activityLevelLabel: ACTIVITY_LABELS[activityLevel],
      bmi,
      bmiCategory: category,
      hasAbnormalBmi: bmi > 0 && (bmi < 12 || bmi > 45),
      needsDisclaimer: bmi > 0 && (bmi < 16 || bmi > 35),
      bmr: safeNumber(pickField(dto, ['bmr'], 0)),
      tdee: safeNumber(pickField(dto, ['tdee'], 0)),
      dataSource: safeEnum(
        pickField(dto, ['dataSource', 'data_source'], 'MANUAL'),
        HealthDataSource,
        HealthDataSource.MANUAL
      ),
      updatedAt: safeDate(pickField(dto, ['updatedAt', 'updated_at'], null)),
    };
  }

  /** Trả `null` khi chưa có dữ liệu sức khỏe (backend trả `healthProfile: null`). */
  toNullableModel(dto: HealthProfileDto | null | undefined): HealthProfile | null {
    if (!dto || typeof dto !== 'object') return null;
    return this.toModel(dto);
  }

  toCreateDto(domain: Partial<HealthProfile>): HealthProfileRequestDto {
    return {
      heightCm: safeNumber(domain.heightCm),
      weightKg: safeNumber(domain.weightKg),
      age: Math.trunc(safeNumber(domain.age)),
      sex: safeString(domain.sex, BiologicalSex.MALE),
      activityLevel: safeString(domain.activityLevel, ActivityLevel.SEDENTARY),
    };
  }

  toUpdateDto(domain: Partial<HealthProfile>): Partial<HealthProfileRequestDto> {
    return this.toCreateDto(domain);
  }
}

export const healthMapper = new HealthMapper();
