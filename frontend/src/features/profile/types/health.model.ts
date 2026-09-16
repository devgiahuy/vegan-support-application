import { ActivityLevel, BiologicalSex, HealthDataSource } from '@/common/enums';

/**
 * Sức khỏe: số `bmi`/`bmr`/`tdee` giữ nguyên backend trả;
 * phân loại/cảnh báo derived ở mapper qua `calcBmi`.
 */
export interface HealthProfile {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: BiologicalSex;
  sexLabel: string;
  activityLevel: ActivityLevel;
  activityLevelLabel: string;
  bmi: number;
  /** Phân loại châu Á (`calcBmi`). */
  bmiCategory: string;
  /** `bmi < 12 || bmi > 45` → cảnh báo giá trị bất thường. */
  hasAbnormalBmi: boolean;
  /** `bmi < 16 || bmi > 35` → disclaimer dinh dưỡng. */
  needsDisclaimer: boolean;
  bmr: number;
  tdee: number;
  dataSource: HealthDataSource;
  updatedAt: Date | null;
}
