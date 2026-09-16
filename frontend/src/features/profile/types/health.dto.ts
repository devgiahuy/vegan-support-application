/**
 * DTO sức khỏe: `HealthProfileResponse.data` và `HealthProfileRequest`.
 * Số backend đã làm tròn 2 decimals — frontend giữ nguyên, không tính lại.
 */
export interface HealthProfileDto {
  heightCm?: number | string;
  height_cm?: number | string;
  weightKg?: number | string;
  weight_kg?: number | string;
  age?: number | string;
  sex?: string;
  activityLevel?: string;
  activity_level?: string;
  bmi?: number | string;
  bmr?: number | string;
  tdee?: number | string;
  dataSource?: string;
  data_source?: string;
  updatedAt?: string;
  updated_at?: string;
}

/** `PUT /users/me/health-profile` — cả 5 field bắt buộc. */
export interface HealthProfileRequestDto {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: string;
  activityLevel: string;
}
