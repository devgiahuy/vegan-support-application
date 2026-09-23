import { ActivityLevel, BiologicalSex, HealthDataSource } from '@/common/enums';

export interface HealthProfile {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: BiologicalSex;
  sexLabel: string;
  activityLevel: ActivityLevel;
  activityLevelLabel: string;
  bmi: number;
  bmiCategory: string;
  hasAbnormalBmi: boolean;
  needsDisclaimer: boolean;
  bmr: number;
  tdee: number;
  dataSource: HealthDataSource;
  updatedAt: Date | null;
}

