/**
 * DTO diet: preview request/response, save preferences, schedule.
 * Theo `docs/api/diet-rules.md` + `docs/api/users.md`.
 */

/**
 * Quy tắc thô trong preview. Shape thật đã verify với BE 2026-09-15:
 * `{id, code, label, description, defaultEnabled, hardConstraint, source, version}`.
 */
export interface DietRuleDto {
  ruleDefinitionId?: string;
  rule_definition_id?: string;
  id?: string;
  code?: string;
  name?: string;
  label?: string;
  rule_name?: string;
  title?: string;
  description?: string;
  source?: string;
  ruleSource?: string;
  isDefault?: boolean;
  is_default?: boolean;
  defaultEnabled?: boolean;
  isHard?: boolean;
  is_hard?: boolean;
  hardConstraint?: boolean;
  hard_constraint?: boolean;
  hard?: boolean;
  required?: boolean;
  enabled?: boolean;
  isEnabled?: boolean;
  version?: number;
}

/** `POST /diet-rules/preview` — cả 3 bắt buộc. */
export interface DietRulePreviewRequestDto {
  dietPattern: string;
  practiceSchedule: string;
  tradition: string;
}

/** `POST /diet-rules/preview` → `DietRulePreviewResponse`. */
export interface DietRulePreviewResponseDto {
  success?: boolean;
  data?: {
    ruleSetVersion?: number;
    rule_set_version?: number;
    selection?: {
      dietPattern?: string;
      practiceSchedule?: string;
      tradition?: string;
    } | null;
    rules?: (DietRuleDto | null)[] | null;
  } | null;
  meta?: null;
}

/** Dị ứng thô. */
export interface AllergyDto {
  allergenCode?: string;
  allergen_code?: string;
  code?: string;
  label?: string;
  name?: string;
  severity?: string;
}

/** Kiêng nguyên liệu thô. */
export interface IngredientExclusionDto {
  ingredientId?: string | null;
  ingredient_id?: string | null;
  ingredientName?: string;
  ingredient_name?: string;
  name?: string;
  reason?: string;
}

/** `PUT /users/me/diet-preferences`. */
export interface SaveDietPreferencesRequestDto {
  dietPattern: string;
  practiceSchedule: string;
  tradition: string;
  ruleSetVersion: number;
  rules: Array<{ ruleDefinitionId: string; enabled: boolean }>;
  scheduleDates?: string[];
  allergies?: Array<{ allergenCode: string; label?: string; severity?: string }>;
  ingredientExclusions?: Array<{ ingredientId?: string; ingredientName: string; reason?: string }>;
}

/** `PUT /users/me/diet-schedule`. */
export interface UpdateDietScheduleRequestDto {
  dates: string[];
}

/** `PUT /users/me/diet-schedule` → `DietScheduleResponse`. */
export interface DietScheduleResponseDto {
  success?: boolean;
  data?: {
    practiceSchedule?: string;
    practice_schedule?: string;
    timezone?: string;
    dates?: (string | null)[] | null;
  } | null;
  meta?: null;
}

/** `PUT /users/me/diet-preferences` → `DietPreferenceResponse` (thô, mapper lo chi tiết). */
export interface DietPreferenceResponseDto {
  success?: boolean;
  data?: Record<string, unknown> | null;
  meta?: null;
}
