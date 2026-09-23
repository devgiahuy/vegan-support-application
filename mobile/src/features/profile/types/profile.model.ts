import type { User } from '@/features/auth/types/auth.model';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';
import type { HealthProfile } from './health.model';

export interface AllergySummary {
  allergenCode: string;
  label: string;
  severity: string;
}

export interface DietPreferenceSummary {
  dietPattern: DietPattern;
  dietPatternLabel: string;
  practiceSchedule: PracticeSchedule;
  practiceScheduleLabel: string;
  tradition: Tradition;
  traditionLabel: string;
  requiresRuleReview: boolean;
  confirmedAt: Date | null;
  scheduleDates: string[];
  scheduleTimezone: string;
  allergies: AllergySummary[];
}

export interface DetailedProfile {
  user: User;
  health: HealthProfile | null;
  diet: DietPreferenceSummary | null;
  memberSince: string;
}
