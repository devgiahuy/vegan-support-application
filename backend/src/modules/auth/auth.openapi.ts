import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import { z } from '../../common/validation/zod.js';
import {
  authSessionResponseSchema,
  loginRequestSchema,
  logoutRequestSchema,
  logoutResponseSchema,
  meResponseSchema,
  refreshResponseSchema,
  registerRequestSchema,
} from './auth.schemas.js';

const requiredRefreshCookieSchema = z.object({
  refreshToken: z.string().min(1).openapi({ description: 'Opaque refresh token; HttpOnly cookie' }),
});

const optionalRefreshCookieSchema = z.object({
  refreshToken: z
    .string()
    .min(1)
    .optional()
    .openapi({ description: 'Opaque refresh token; HttpOnly cookie' }),
});

const sessionCookieHeaders = {
  'Set-Cookie': {
    description:
      'Sets HttpOnly accessToken and refreshToken cookies. Secure is enabled in production; SameSite=Lax; Path=/.',
    schema: { type: 'string' as const },
  },
};

const clearedSessionCookieHeaders = {
  'Set-Cookie': {
    description: 'Expires the HttpOnly accessToken and refreshToken cookies at Path=/.',
    schema: { type: 'string' as const },
  },
};

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

export function registerAuthOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  registry.registerComponent('securitySchemes', 'BearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });
  registry.registerComponent('securitySchemes', 'AccessTokenCookie', {
    type: 'apiKey',
    in: 'cookie',
    name: 'accessToken',
  });

  const registerRequest = registry.register('RegisterRequest', registerRequestSchema);
  const loginRequest = registry.register('LoginRequest', loginRequestSchema);
  const logoutRequest = registry.register('LogoutRequest', logoutRequestSchema);
  const authSessionResponse = registry.register('AuthSessionResponse', authSessionResponseSchema);
  const refreshResponse = registry.register('RefreshResponse', refreshResponseSchema);
  const logoutResponse = registry.register('LogoutResponse', logoutResponseSchema);
  const meResponse = registry.register('MeResponse', meResponseSchema);

  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/register',
    tags: ['Auth'],
    summary: 'Đăng ký tài khoản Member',
    description:
      'Contributor request chỉ tạo application PENDING; user và JWT luôn có role MEMBER cho tới khi Admin duyệt.',
    operationId: 'register',
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: registerRequest,
            example: {
              email: 'member@example.com',
              password: 'StrongPassword123!',
              displayName: 'Nguyễn An',
              contributorRequest: {
                requestedType: 'NUTRITION_EXPERT',
                experience: 'Tôi có kinh nghiệm tư vấn dinh dưỡng thực vật.',
                referenceLinks: ['https://example.com/profile'],
              },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Đăng ký thành công',
        headers: sessionCookieHeaders,
        content: { 'application/json': { schema: authSessionResponse } },
      },
      400: errorResponse(errorSchema, 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR'),
      409: errorResponse(errorSchema, 'Email đã được sử dụng', 'EMAIL_ALREADY_EXISTS'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/login',
    tags: ['Auth'],
    summary: 'Đăng nhập',
    operationId: 'login',
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: loginRequest,
            example: { email: 'member@example.com', password: 'StrongPassword123!' },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Đăng nhập thành công',
        headers: sessionCookieHeaders,
        content: { 'application/json': { schema: authSessionResponse } },
      },
      401: errorResponse(errorSchema, 'Email hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS'),
      403: errorResponse(errorSchema, 'Tài khoản đã bị cấm', 'ACCOUNT_BANNED'),
      423: errorResponse(errorSchema, 'Tài khoản đang tạm khóa', 'ACCOUNT_LOCKED'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/refresh',
    tags: ['Auth'],
    summary: 'Rotate refresh token và cấp access token mới',
    description:
      'Refresh token cũ bị revoke ngay sau rotation. Reuse sẽ revoke toàn bộ token family.',
    operationId: 'refreshSession',
    request: { cookies: requiredRefreshCookieSchema },
    responses: {
      200: {
        description: 'Làm mới phiên thành công',
        headers: sessionCookieHeaders,
        content: { 'application/json': { schema: refreshResponse } },
      },
      401: errorResponse(
        errorSchema,
        'Refresh token không hợp lệ hoặc đã hết hạn',
        'INVALID_REFRESH_TOKEN',
      ),
      403: errorResponse(errorSchema, 'Tài khoản đã bị cấm', 'ACCOUNT_BANNED'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/logout',
    tags: ['Auth'],
    summary: 'Đăng xuất phiên hiện tại hoặc tất cả thiết bị',
    operationId: 'logout',
    request: {
      cookies: optionalRefreshCookieSchema,
      body: {
        required: false,
        content: { 'application/json': { schema: logoutRequest, example: { allDevices: false } } },
      },
    },
    responses: {
      200: {
        description: 'Đăng xuất idempotent; xóa accessToken và refreshToken cookies',
        headers: clearedSessionCookieHeaders,
        content: { 'application/json': { schema: logoutResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/users/me',
    tags: ['Users'],
    summary: 'Lấy user và role đã được backend phê duyệt',
    operationId: 'getMe',
    security: [{ BearerAuth: [] }, { AccessTokenCookie: [] }],
    responses: {
      200: {
        description: 'User hiện tại',
        content: { 'application/json': { schema: meResponse } },
      },
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', 'AUTH_REQUIRED'),
      403: errorResponse(errorSchema, 'Tài khoản đã bị cấm', 'ACCOUNT_BANNED'),
    },
  });
}
