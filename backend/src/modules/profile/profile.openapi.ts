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
    summary: 'Lấy hồ sơ người dùng hiện tại',
    description:
      'Trả role backend-authoritative, health data MANUAL, diet snapshot và effective constraints; không trả password/session fields.',
    operationId: 'getMe',
    security: authenticated,
    responses: {
      200: {
        description: 'Hồ sơ hiện tại',
        content: { 'application/json': { schema: profileResponse } },
      },
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'Tài khoản đã bị cấm', 'ACCOUNT_BANNED'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/users/me',
    tags: ['Users'],
    summary: 'Cập nhật hồ sơ cơ bản',
    operationId: 'updateMe',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: updateBasicProfileRequest,
            example: { displayName: 'Nguyễn An', avatarUrl: 'https://cdn.example.com/avatar.jpg' },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Hồ sơ đã cập nhật',
        content: { 'application/json': { schema: profileResponse } },
      },
      400: errorResponse(errorSchema, 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR'),
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'Tài khoản đã bị cấm', 'ACCOUNT_BANNED'),
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/users/me/health-profile',
    tags: ['Users'],
    summary: 'Lưu dữ liệu sức khỏe thủ công và tính BMI/BMR/TDEE',
    description:
      'Dùng công thức Mifflin–St Jeor; activity factors SEDENTARY/LIGHTLY_ACTIVE/MODERATELY_ACTIVE/VERY_ACTIVE/EXTRA_ACTIVE lần lượt là 1.2/1.375/1.55/1.725/1.9. dataSource luôn là MANUAL và kết quả làm tròn hai chữ số.',
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
        description: 'Health profile và chỉ số đã tính',
        content: { 'application/json': { schema: healthProfileResponse } },
      },
      400: errorResponse(errorSchema, 'Dữ liệu sức khỏe không hợp lệ', 'VALIDATION_ERROR'),
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'Tài khoản đã bị cấm', 'ACCOUNT_BANNED'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/diet-rules/preview',
    tags: ['Diet Rules'],
    summary: 'Xem trước bộ quy tắc diet/tradition hiện hành',
    description:
      'Tradition rules là tùy chọn do user xác nhận; allergy và explicit exclusions không nằm trong danh sách toggle này.',
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
        description: 'Rule set có version và default toggle',
        content: { 'application/json': { schema: dietRulePreviewResponse } },
      },
      400: errorResponse(errorSchema, 'Lựa chọn không hợp lệ', 'VALIDATION_ERROR'),
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'Tài khoản đã bị cấm', 'ACCOUNT_BANNED'),
      503: errorResponse(errorSchema, 'Bộ quy tắc chưa sẵn sàng', 'DIET_RULES_UNAVAILABLE'),
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/users/me/diet-preferences',
    tags: ['Users', 'Diet Rules'],
    summary: 'Xác nhận diet preferences, rules và hard constraints cá nhân',
    description:
      'Rule IDs phải khớp toàn bộ preview/version. Diet-pattern rule không thể tắt. PERIODIC bắt buộc có scheduleDates theo Asia/Ho_Chi_Minh. Ingredient exclusion nhận optional canonical ingredientId; free-text vẫn được giữ khi chưa map. Allergies và exclusions luôn là hard constraints.',
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
                  ingredientName: 'Đậu hũ',
                  reason: 'Không thích',
                },
              ],
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Snapshot preference và effective constraints đã lưu',
        content: { 'application/json': { schema: dietPreferenceResponse } },
      },
      400: multipleErrorResponse(errorSchema, 'Rule hoặc preference không hợp lệ', [
        'VALIDATION_ERROR',
        'INVALID_DIET_RULE_SELECTION',
        'DIET_RULE_REQUIRED',
        'INVALID_INGREDIENT_EXCLUSIONS',
        'DIET_SCHEDULE_NOT_APPLICABLE',
      ]),
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'Tài khoản đã bị cấm', 'ACCOUNT_BANNED'),
      409: multipleErrorResponse(
        errorSchema,
        'Bộ quy tắc đã thay đổi hoặc lịch PERIODIC chưa có ngày',
        ['DIET_RULE_RECONFIRMATION_REQUIRED', 'DIET_SCHEDULE_REQUIRED'],
      ),
      503: errorResponse(errorSchema, 'Bộ quy tắc chưa sẵn sàng', 'DIET_RULES_UNAVAILABLE'),
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/users/me/diet-schedule',
    tags: ['Users', 'Diet Rules'],
    summary: 'Thay thế danh sách ngày áp dụng tradition rules cho PERIODIC',
    description:
      'Date-only YYYY-MM-DD được lưu bằng PostgreSQL DATE với semantic Asia/Ho_Chi_Minh; backend không tự tính lịch âm/ngày lễ.',
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
        description: 'Lịch PERIODIC đã cập nhật',
        content: { 'application/json': { schema: dietScheduleResponse } },
      },
      400: errorResponse(errorSchema, 'Danh sách ngày không hợp lệ', 'VALIDATION_ERROR'),
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'Tài khoản đã bị cấm', 'ACCOUNT_BANNED'),
      409: multipleErrorResponse(
        errorSchema,
        'Cần diet preference PERIODIC và ít nhất một ngày hợp lệ',
        ['DIET_PREFERENCES_REQUIRED', 'DIET_SCHEDULE_NOT_APPLICABLE', 'DIET_SCHEDULE_REQUIRED'],
      ),
    },
  });
}
