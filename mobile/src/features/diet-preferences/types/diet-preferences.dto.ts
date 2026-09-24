/**
 * DTO cho luồng thiết lập chế độ ăn/dị ứng/loại trừ (đồng bộ backend
 * `profile.schemas.ts`: `dietRulePreviewResponseSchema`, `saveDietPreferencesRequestSchema`,
 * `dietPreferenceResponseSchema`). Đây là ràng buộc backend-enforced — frontend chỉ thu
 * thập và hiển thị, KHÔNG tự lọc thay backend.
 */
export interface DietRulePreviewItemDto {
  id?: string;
  code?: string;
  label?: string;
  description?: string;
  defaultEnabled?: boolean;
  hardConstraint?: boolean;
  source?: string;
  version?: number;
}

/** `POST /diet-rules/preview` response. */
export interface DietRulePreviewResponseDto {
  success?: boolean;
  data?: {
    ruleSetVersion?: number;
    selection?: { dietPattern?: string; practiceSchedule?: string; tradition?: string };
    rules?: (DietRulePreviewItemDto | null)[];
  } | null;
  meta?: null;
}

export interface SelectedDietRuleDto {
  ruleDefinitionId: string;
  enabled: boolean;
}

export interface AllergyInputDto {
  allergenCode: string;
  label?: string;
  severity?: string;
}

export interface IngredientExclusionInputDto {
  ingredientId?: string;
  ingredientName: string;
  reason?: string;
}

/** `PUT /users/me/diet-preferences` request. */
export interface SaveDietPreferencesRequestDto {
  dietPattern: string;
  practiceSchedule: string;
  tradition: string;
  ruleSetVersion: number;
  rules: SelectedDietRuleDto[];
  scheduleDates?: string[];
  allergies: AllergyInputDto[];
  ingredientExclusions: IngredientExclusionInputDto[];
}

/** `PUT /users/me/diet-preferences` response — cùng shape `dietPreference` trong `GET /users/me`. */
export interface DietPreferenceResponseDto {
  success?: boolean;
  data?: Record<string, unknown> | null;
  meta?: null;
}
