import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  mealAnalysisParamsSchema,
  mealAnalysisRequestSchema,
  mealAnalysisResponseSchema,
} from './meal-analysis.schemas.js';

const security = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];
const error = (schema: ZodType, description: string, codes: string[]) => ({
  description,
  content: {
    'application/json': {
      schema,
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
});

export function registerMealAnalysisOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const request = registry.register('MealAnalysisRequest', mealAnalysisRequestSchema);
  const response = registry.register('MealAnalysisResponse', mealAnalysisResponseSchema);
  registry.registerPath({
    method: 'post',
    path: '/api/v1/meal-plans/{id}/analyze',
    tags: ['Meal Analysis'],
    summary: 'Phân tích khẩu phần và các điểm cần lưu ý trong thực đơn',
    description:
      'Phân tích món và khẩu phần đã chọn. Cảnh báo dinh dưỡng dành cho người dùng chỉ tập trung vào chất đạm, chất xơ, chất béo và tinh bột, luôn được diễn đạt là số liệu ước tính. Kết quả có tiêu đề, giải thích vị trí/ngày/bữa, ý nghĩa và gợi ý điều chỉnh bằng tiếng Việt. Thông tin nguồn và mã vẫn được giữ để kiểm tra nội bộ; dị ứng và các yêu cầu ăn uống bắt buộc không thay đổi.',
    operationId: 'analyzeMealPlan',
    security,
    request: {
      params: mealAnalysisParamsSchema,
      body: {
        required: true,
        content: {
          'application/json': {
            schema: request,
            example: {
              expectedPlanVersion: 2,
              items: [{ itemId: '10000000-0000-4000-8000-000000000001', servings: 1.5 }],
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Kết quả phân tích mới với cảnh báo và gợi ý dễ hiểu cho người dùng',
        content: { 'application/json': { schema: response } },
      },
      400: error(errorSchema, 'Selection hoặc portion không hợp lệ', [
        'VALIDATION_ERROR',
        'MEAL_ANALYSIS_ITEM_UNFILLED',
        'MEAL_ANALYSIS_SOURCE_MISSING',
      ]),
      401: error(errorSchema, 'Yêu cầu đăng nhập', [
        'AUTH_REQUIRED',
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: error(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
      404: error(errorSchema, 'Không tìm thấy owned plan/item', ['NOT_FOUND']),
      409: error(errorSchema, 'Plan version đã thay đổi', ['MEAL_ANALYSIS_STALE']),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/meal-plans/{id}/analysis',
    tags: ['Meal Analysis'],
    summary: 'Đọc kết quả phân tích hiện hành',
    description:
      'Trả kết quả còn phù hợp với thực đơn hiện tại. Nếu món, khẩu phần hoặc thông tin liên quan đã thay đổi, yêu cầu phân tích lại thay vì trả kết quả cũ.',
    operationId: 'getCurrentMealAnalysis',
    security,
    request: { params: mealAnalysisParamsSchema },
    responses: {
      200: {
        description:
          'Kết quả hiện hành với nội dung cảnh báo tiếng Việt và thông tin kiểm tra nội bộ',
        content: { 'application/json': { schema: response } },
      },
      400: error(errorSchema, 'Meal plan ID không hợp lệ', ['VALIDATION_ERROR']),
      401: error(errorSchema, 'Yêu cầu đăng nhập', [
        'AUTH_REQUIRED',
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: error(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
      404: error(errorSchema, 'Không có owned plan/analysis', ['NOT_FOUND']),
      409: error(errorSchema, 'Analysis không còn current', ['MEAL_ANALYSIS_STALE']),
    },
  });
}
