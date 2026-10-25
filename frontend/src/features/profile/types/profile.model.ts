import type { User } from '@/features/auth/types/auth.model';
import type { HealthProfile } from './health.model';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';
import type { DietPreference } from '@/features/diet-preferences/types/diet.model';

/**
 * Tóm tắt diet nhúng trong hồ sơ (profile sở hữu; chi tiết đầy đủ thuộc `features/diet-preferences`).
 * Mở rộng từ DietPreference để mang đầy đủ thông tin dị ứng, kiêng kỵ và quy tắc.
 */
export interface DietPreferenceSummary extends DietPreference {
  /** Ngày chay kỳ `YYYY-MM-DD` (rỗng khi PERMANENT hoặc chưa đặt). */
  scheduleDates: string[];
  scheduleTimezone: string;
}

/**
 * Hồ sơ chi tiết: dùng lại `User` từ auth cho 8 field cơ bản,
 * mở rộng thêm sức khỏe + tóm tắt diet.
 */
export interface DetailedProfile {
  user: User;
  health: HealthProfile | null;
  diet: DietPreferenceSummary | null;
  /** Ngày tham gia đã format (`formatDate`), '-' khi không có. */
  memberSince: string;
}
