import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  dietPreferenceResponseSchema,
  dietRulePreviewResponseSchema,
  dietRuleSelectionSchema,
  dietScheduleResponseSchema,
  healthProfileRequestSchema,
  healthProfileResponseSchema,
  profileResponseSchema,
  saveDietPreferencesRequestSchema,
  updateBasicProfileRequestSchema,
  updateDietScheduleRequestSchema,
} from './profile.schemas.js';

const authenticated = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];

function errorResponse(errorSchema: ZodType, description: string, code: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: errorSchema,
        example: {
          success: false,
          error: {
            code,
            message: description,
            requestId: '0781d468-5eb1-4bd0-9671-e4ca33b76462',
          },
        },
      },
    },
  };
}

function multipleErrorResponse(errorSchema: ZodType, description: string, codes: string[]) {
  return {
    description,
    content: {
      'application/json': {
        schema: errorSchema,
        examples: Object.fromEntries(
          codes.map((code) => [
            code,
            {
              value: {
                success: false,
                error: {
                  code,
                  message: description,
                  requestId: '0781d468-5eb1-4bd0-9671-e4ca33b76462',
                },
              },
            },
          ]),
        ),
      },
    },
  };
}

export function registerProfileOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const updateBasicProfileRequest = registry.register(
    'UpdateBasicProfileRequest',
    updateBasicProfileRequestSchema,
  );
  const profileResponse = registry.register('ProfileResponse', profileResponseSchema);
  const healthProfileRequest = registry.register(
    'HealthProfileRequest',
    healthProfileRequestSchema,
  );
  const healthProfileResponse = registry.register(
    'HealthProfileResponse',
    healthProfileResponseSchema,
  );
  const dietRulePreviewRequest = registry.register(
    'DietRulePreviewRequest',
    dietRuleSelectionSchema,
  );
  const dietRulePreviewResponse = registry.register(
    'DietRulePreviewResponse',
    dietRulePreviewResponseSchema,
  );
  const saveDietPreferencesRequest = registry.register(
    'SaveDietPreferencesRequest',
    saveDietPreferencesRequestSchema,
  );
  const dietPreferenceResponse = registry.register(
    'DietPreferenceResponse',
    dietPreferenceResponseSchema,
  );
  const updateDietScheduleRequest = registry.register(
    'UpdateDietScheduleRequest',
    updateDietScheduleRequestSchema,
  );
  const dietScheduleResponse = registry.register(
    'DietScheduleResponse',
    dietScheduleResponseSchema,
  );

  registry.registerPath({
    method: 'get',
    path: '/api/v1/users/me',
    tags: ['Users'],
    summary: 'L?y h? so ngu?i d�ng hi?n t?i',
    description:
      'Tr? role backend-authoritative, health data MANUAL, diet snapshot v� effective constraints; kh�ng tr? password/session fields.',
    operationId: 'getMe',
    security: authenticated,
    responses: {
      200: {
        description: 'H? so hi?n t?i',
        content: { 'application/json': { schema: profileResponse } },
      },
      401: errorResponse(errorSchema, 'Y�u c?u dang nh?p', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'T�i kho?n d� b? c?m', 'ACCOUNT_BANNED'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/users/me',
    tags: ['Users'],
    summary: 'C?p nh?t h? so co b?n',
    operationId: 'updateMe',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: updateBasicProfileRequest,
            example: { displayName: 'Nguy?n An', avatarUrl: 'https://cdn.example.com/avatar.jpg' },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'H? so d� c?p nh?t',
        content: { 'application/json': { schema: profileResponse } },
      },
      400: errorResponse(errorSchema, 'D? li?u kh�ng h?p l?', 'VALIDATION_ERROR'),
      401: errorResponse(errorSchema, 'Y�u c?u dang nh?p', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'T�i kho?n d� b? c?m', 'ACCOUNT_BANNED'),
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/users/me/health-profile',
    tags: ['Users'],
    summary: 'Luu d? li?u s?c kh?e th? c�ng v� t�nh BMI/BMR/TDEE',
    description:
      'D�ng c�ng th?c Mifflin�St Jeor; activity factors SEDENTARY/LIGHTLY_ACTIVE/MODERATELY_ACTIVE/VERY_ACTIVE/EXTRA_ACTIVE l?n lu?t l� 1.2/1.375/1.55/1.725/1.9. dataSource lu�n l� MANUAL v� k?t qu? l�m tr�n hai ch? s?.',
    operationId: 'updateHealthProfile',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: healthProfileRequest,
            example: {
              heightCm: 170,
              weightKg: 65,
              age: 25,
              sex: 'FEMALE',
              activityLevel: 'MODERATELY_ACTIVE',
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Health profile v� ch? s? d� t�nh',
        content: { 'application/json': { schema: healthProfileResponse } },
      },
      400: errorResponse(errorSchema, 'D? li?u s?c kh?e kh�ng h?p l?', 'VALIDATION_ERROR'),
      401: errorResponse(errorSchema, 'Y�u c?u dang nh?p', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'T�i kho?n d� b? c?m', 'ACCOUNT_BANNED'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/diet-rules/preview',
    tags: ['Diet Rules'],
    summary: 'Xem tru?c b? quy t?c diet/tradition hi?n h�nh',
    description:
      'Tradition rules l� t�y ch?n do user x�c nh?n; allergy v� explicit exclusions kh�ng n?m trong danh s�ch toggle n�y.',
    operationId: 'previewDietRules',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: dietRulePreviewRequest,
            example: {
              dietPattern: 'VEGAN',
              practiceSchedule: 'PERIODIC',
              tradition: 'BUDDHIST',
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Rule set c� version v� default toggle',
        content: { 'application/json': { schema: dietRulePreviewResponse } },
      },
      400: errorResponse(errorSchema, 'L?a ch?n kh�ng h?p l?', 'VALIDATION_ERROR'),
      401: errorResponse(errorSchema, 'Y�u c?u dang nh?p', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'T�i kho?n d� b? c?m', 'ACCOUNT_BANNED'),
      503: errorResponse(errorSchema, 'B? quy t?c chua s?n s�ng', 'DIET_RULES_UNAVAILABLE'),
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/users/me/diet-preferences',
    tags: ['Users', 'Diet Rules'],
    summary: 'X�c nh?n diet preferences, rules v� hard constraints c� nh�n',
    description:
      'Rule IDs ph?i kh?p to�n b? preview/version. Diet-pattern rule kh�ng th? t?t. PERIODIC b?t bu?c c� scheduleDates theo Asia/Ho_Chi_Minh. Ingredient exclusion nh?n optional canonical ingredientId; free-text v?n du?c gi? khi chua map. Allergies v� exclusions lu�n l� hard constraints.',
    operationId: 'saveDietPreferences',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: saveDietPreferencesRequest,
            example: {
              dietPattern: 'VEGAN',
              practiceSchedule: 'PERIODIC',
              tradition: 'BUDDHIST',
              ruleSetVersion: 1,
              rules: [
                { ruleDefinitionId: '11111111-1111-4111-8111-111111111111', enabled: true },
                { ruleDefinitionId: '22222222-2222-4222-8222-222222222222', enabled: false },
              ],
              scheduleDates: ['2026-09-18', '2026-09-25'],
              allergies: [{ allergenCode: 'PEANUT', severity: 'SEVERE' }],
              ingredientExclusions: [
                {
                  ingredientId: '33333333-3333-4333-8333-333333333333',
                  ingredientName: '�?u hu',
                  reason: 'Kh�ng th�ch',
                },
              ],
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Snapshot preference v� effective constraints d� luu',
        content: { 'application/json': { schema: dietPreferenceResponse } },
      },
      400: multipleErrorResponse(errorSchema, 'Rule ho?c preference kh�ng h?p l?', [
        'VALIDATION_ERROR',
        'INVALID_DIET_RULE_SELECTION',
        'DIET_RULE_REQUIRED',
        'INVALID_INGREDIENT_EXCLUSIONS',
        'DIET_SCHEDULE_NOT_APPLICABLE',
      ]),
      401: errorResponse(errorSchema, 'Y�u c?u dang nh?p', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'T�i kho?n d� b? c?m', 'ACCOUNT_BANNED'),
      409: multipleErrorResponse(
        errorSchema,
        'B? quy t?c d� thay d?i ho?c l?ch PERIODIC chua c� ng�y',
        ['DIET_RULE_RECONFIRMATION_REQUIRED', 'DIET_SCHEDULE_REQUIRED'],
      ),
      503: errorResponse(errorSchema, 'B? quy t?c chua s?n s�ng', 'DIET_RULES_UNAVAILABLE'),
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/users/me/diet-schedule',
    tags: ['Users', 'Diet Rules'],
    summary: 'Thay th? danh s�ch ng�y �p d?ng tradition rules cho PERIODIC',
    description:
      'Date-only YYYY-MM-DD du?c luu b?ng PostgreSQL DATE v?i semantic Asia/Ho_Chi_Minh; backend kh�ng t? t�nh l?ch �m/ng�y l?.',
    operationId: 'updateDietSchedule',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: updateDietScheduleRequest,
            example: { dates: ['2026-09-18', '2026-09-25'] },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'L?ch PERIODIC d� c?p nh?t',
        content: { 'application/json': { schema: dietScheduleResponse } },
      },
      400: errorResponse(errorSchema, 'Danh s�ch ng�y kh�ng h?p l?', 'VALIDATION_ERROR'),
      401: errorResponse(errorSchema, 'Y�u c?u dang nh?p', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'T�i kho?n d� b? c?m', 'ACCOUNT_BANNED'),
      409: multipleErrorResponse(
        errorSchema,
        'C?n diet preference PERIODIC v� �t nh?t m?t ng�y h?p l?',
        ['DIET_PREFERENCES_REQUIRED', 'DIET_SCHEDULE_NOT_APPLICABLE', 'DIET_SCHEDULE_REQUIRED'],
      ),
    },
  });
}
