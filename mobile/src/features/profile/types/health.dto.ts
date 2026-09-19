export interface HealthProfileDto {
  heightCm?: number;
  height_cm?: number;
  weightKg?: number;
  weight_kg?: number;
  age?: number;
  sex?: string;
  activityLevel?: string;
  activity_level?: string;
  bmi?: number;
  bmr?: number;
  tdee?: number;
  dataSource?: string;
  data_source?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface HealthProfileRequestDto {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: string;
  activityLevel: string;
}

