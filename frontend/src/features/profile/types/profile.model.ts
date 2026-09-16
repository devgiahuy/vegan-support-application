import type { User } from '@/features/auth/types/auth.model';
import type { HealthProfile } from './health.model';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';

/**
 * Tóm tắt diet nhúng trong hồ sơ (profile sở hữu; chi tiết đầy đủ thuộc `features/diet-preferences`).
 */
export interface DietPreferenceSummary {
  dietPattern: DietPattern;
  dietPatternLabel: string;
  practiceSchedule: PracticeSchedule;
  practiceScheduleLabel: string;
  tradition: Tradition;
  traditionLabel: string;
  requiresRuleReview: boolean;
  confirmedAt: Date | null;
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
