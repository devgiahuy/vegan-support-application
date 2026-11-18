import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  dietPreferenceResponseSchema,
  dietRulePreviewResponseSchema,
  dietRuleSelectionSchema,
  healthProfileRequestSchema,
  healthProfileResponseSchema,
  profileResponseSchema,
  saveDietPreferencesRequestSchema,
  updateBasicProfileRequestSchema,
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
    operationId: 'previewDietRules',
    summary: 'Xem trước bốn tùy chọn thực phẩm áp dụng mọi ngày',
    description:
      'Bật nghĩa là được ăn; dị ứng và nguyên liệu kiêng luôn ưu tiên. Ngũ vị tân: hành, hẹ, tỏi, kiệu, hưng cừ. Không có lựa chọn tôn giáo hay lịch chay.',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: dietRulePreviewRequest,
            example: {
              allowEggs: true,
              allowDairy: false,
              allowHoney: true,
              allowFivePungent: false,
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Chính sách hiện hành và nhóm thực phẩm',
        content: { 'application/json': { schema: dietRulePreviewResponse } },
      },
      400: errorResponse(errorSchema, 'Lựa chọn không hợp lệ', 'VALIDATION_ERROR'),
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'Tài khoản không được phép', 'ACCOUNT_BANNED'),
    },
  });
  registry.registerPath({
    method: 'put',
    path: '/api/v1/users/me/diet-preferences',
    tags: ['Users', 'Diet Rules'],
    operationId: 'saveDietPreferences',
    summary: 'Lưu bốn tùy chọn thực phẩm và hạn chế cá nhân',
    description:
      'Contract mới cho bản dev. Bốn boolean độc lập áp dụng mọi ngày; thịt/cá và thành phần thuộc nhóm cấm luôn bị loại. policyVersion=1; expectedDietaryRevision=0 cho lần lưu đầu. Save kiểm tra revision, lưu nguyên tử và làm stale các phân tích/thực đơn liên quan. IngredientAllergies bỏ qua thì giữ nguyên; [] xóa hết. Allergies/exclusions được thay thế theo payload. Không tự thay món chỉ vì profile đã lưu.',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: saveDietPreferencesRequest,
            example: {
              allowEggs: true,
              allowDairy: false,
              allowHoney: true,
              allowFivePungent: false,
              policyVersion: 1,
              expectedDietaryRevision: 0,
              allergies: [],
              ingredientAllergies: [],
              ingredientExclusions: [],
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Thiết lập đã lưu và dietary revision',
        content: { 'application/json': { schema: dietPreferenceResponse } },
      },
      400: multipleErrorResponse(errorSchema, 'Lựa chọn không hợp lệ', [
        'VALIDATION_ERROR',
        'INVALID_ALLERGEN_SELECTION',
        'INVALID_INGREDIENT_ALLERGIES',
        'INVALID_INGREDIENT_EXCLUSIONS',
      ]),
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'Tài khoản không được phép', 'ACCOUNT_BANNED'),
      409: multipleErrorResponse(errorSchema, 'Thiết lập hoặc chính sách đã thay đổi', [
        'DIET_PREFERENCES_CONFLICT',
        'DIET_RULE_RECONFIRMATION_REQUIRED',
      ]),
    },
  });
}
