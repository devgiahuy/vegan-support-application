import type { User } from '@/features/auth/types/auth.model';
import type { HealthProfile } from './health.model';
import type { DietPreference } from '@/features/diet-preferences/types/diet.model';
export type DietPreferenceSummary = DietPreference;
export interface DetailedProfile {
  user: User;
  health: HealthProfile | null;
  diet: DietPreferenceSummary | null;
  memberSince: string;
}
