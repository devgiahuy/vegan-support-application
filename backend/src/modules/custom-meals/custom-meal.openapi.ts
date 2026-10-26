import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../../common/validation/zod.js';
import {
  attachPhotoSchema,
  createCustomMealSchema,
  customMealIdParamsSchema,
  customMealListQuerySchema,
  customMealListResponseSchema,
  customMealResponseSchema,
  removePhotoParamsSchema,
  reorderPhotosSchema,
  updateCustomMealSchema,
} from './custom-meal.schemas.js';

const tag = 'Custom Meals';
const security = [{ bearerAuth: [] }];

const successResponse = (description: string, schema: z.ZodTypeAny) => ({
  200: {
    description,
    content: { 'application/json': { schema } },
  },
});

const successCreatedResponse = (description: string, schema: z.ZodTypeAny) => ({
  201: {
    description,
    content: {
      'application/json': {
        schema: z.object({ success: z.literal(true), data: schema }),
      },
    },
  },
});

const ingredientReferenceError = (schema: z.ZodTypeAny) => ({
  description: 'VALIDATION_ERROR, INVALID_INGREDIENT_REFERENCE, or INGREDIENT_ID_NAME_MISMATCH',
  content: {
    'application/json': {
      schema,
      examples: {
        ingredientMismatch: {
          value: {
            success: false,
            error: {
              code: 'INGREDIENT_ID_NAME_MISMATCH',
              message: 'Tên nguyên liệu không khớp với nguyên liệu chuẩn đã chọn',
              requestId: '00000000-0000-4000-8000-000000000001',
            },
          },
        },
      },
    },
  },
});

export function registerCustomMealOpenApi(
  registry: OpenAPIRegistry,
  errorResponse: z.ZodTypeAny,
): void {
  const mealResponse = registry.register('CustomMealResponse', customMealResponseSchema);
  const mealListResponse = registry.register('CustomMealListResponse', customMealListResponseSchema);

  registry.registerPath({
    method: 'get',
    path: '/api/v1/custom-meals',
    tags: [tag],
    summary: 'Danh sách bữa ăn tùy chỉnh của tôi',
    operationId: 'listCustomMeals',
    security,
    request: { query: customMealListQuerySchema },
    responses: {
      200: {
        description: 'Danh sách bữa ăn tùy chỉnh',
        content: { 'application/json': { schema: mealListResponse } },
      },
      401: { description: 'Chưa xác thực', content: { 'application/json': { schema: errorResponse } } },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/custom-meals',
    tags: [tag],
    summary: 'Tạo bữa ăn tùy chỉnh mới',
    description:
      'Tự tính tổng dinh dưỡng toàn bộ món từ nguyên liệu/tên hoặc alias đã duyệt. Chỉ số thiếu dữ liệu cho bất kỳ nguyên liệu nào được ước tính bằng AI khi khả dụng, không dùng tổng thiếu làm tổng đầy đủ. Tên món nhận diện được cũng có thể được ước tính khi chưa nhập nguyên liệu, với giả định khẩu phần rõ ràng. user* giữ các giá trị hiện hành để tương thích; nutritionMetadata.metrics phân biệt USER_PROVIDED, CANONICAL_CALCULATED và AI_ESTIMATED. Metadata trả nguồn/version/license, giả định, độ tin cậy và độ không chắc chắn. Provider lỗi không hủy món; chỉ số thiếu giữ null.',
    operationId: 'createCustomMeal',
    security,
    request: { body: { content: { 'application/json': { schema: createCustomMealSchema } } } },
    responses: {
      ...successCreatedResponse(
        'Bữa ăn tùy chỉnh được tạo',
        mealResponse,
      ),
      400: ingredientReferenceError(errorResponse),
      401: { description: 'Chưa xác thực', content: { 'application/json': { schema: errorResponse } } },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/custom-meals/{id}',
    tags: [tag],
    summary: 'Chi tiết bữa ăn tùy chỉnh',
    operationId: 'getCustomMeal',
    security,
    request: { params: customMealIdParamsSchema },
    responses: {
      ...successResponse(
        'Chi tiết bữa ăn tùy chỉnh',
        z.object({ success: z.literal(true), data: mealResponse }),
      ),
      401: { description: 'Chưa xác thực', content: { 'application/json': { schema: errorResponse } } },
      404: { description: 'Không tìm thấy', content: { 'application/json': { schema: errorResponse } } },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/custom-meals/{id}',
    tags: [tag],
    summary: 'Cập nhật bữa ăn tùy chỉnh',
    description:
      'Tính lại khi đổi tên, nguyên liệu, số khẩu phần hoặc chỉ số dinh dưỡng. Giữ giá trị USER_PROVIDED; xóa và tính lại giá trị tự động cũ. Gửi user*=null để bỏ ghi đè và cho phép tính lại chỉ số đó. Kết quả AI không ghi đè canonical data và không được lưu nếu món đã thay đổi trong lúc phân tích.',
    operationId: 'updateCustomMeal',
    security,
    request: {
      params: customMealIdParamsSchema,
      body: { content: { 'application/json': { schema: updateCustomMealSchema } } },
    },
    responses: {
      ...successResponse(
        'Bữa ăn được cập nhật',
        z.object({ success: z.literal(true), data: mealResponse }),
      ),
      400: ingredientReferenceError(errorResponse),
      401: { description: 'Chưa xác thực', content: { 'application/json': { schema: errorResponse } } },
      404: { description: 'Không tìm thấy', content: { 'application/json': { schema: errorResponse } } },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/custom-meals/{id}',
    tags: [tag],
    summary: 'Xóa bữa ăn tùy chỉnh',
    operationId: 'deleteCustomMeal',
    security,
    request: { params: customMealIdParamsSchema },
    responses: {
      204: { description: 'Đã xóa thành công' },
      401: { description: 'Chưa xác thực', content: { 'application/json': { schema: errorResponse } } },
      404: { description: 'Không tìm thấy', content: { 'application/json': { schema: errorResponse } } },
      409: {
        description: 'Bữa ăn đang được dùng trong kế hoạch (CUSTOM_MEAL_IN_USE)',
        content: { 'application/json': { schema: errorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/custom-meals/{id}/photos',
    tags: [tag],
    summary: 'Gắn ảnh vào bữa ăn tùy chỉnh',
    operationId: 'attachCustomMealPhoto',
    security,
    request: {
      params: customMealIdParamsSchema,
      body: { content: { 'application/json': { schema: attachPhotoSchema } } },
    },
    responses: {
      ...successResponse(
        'Ảnh đã được gắn',
        z.object({ success: z.literal(true), data: mealResponse }),
      ),
      401: { description: 'Chưa xác thực', content: { 'application/json': { schema: errorResponse } } },
      404: { description: 'Không tìm thấy', content: { 'application/json': { schema: errorResponse } } },
      422: { description: 'Asset không hợp lệ hoặc đã đạt giới hạn ảnh', content: { 'application/json': { schema: errorResponse } } },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/custom-meals/{id}/photos/{assetId}',
    tags: [tag],
    summary: 'Gỡ ảnh khỏi bữa ăn tùy chỉnh',
    operationId: 'removeCustomMealPhoto',
    security,
    request: { params: removePhotoParamsSchema },
    responses: {
      ...successResponse(
        'Ảnh đã được gỡ',
        z.object({ success: z.literal(true), data: mealResponse }),
      ),
      401: { description: 'Chưa xác thực', content: { 'application/json': { schema: errorResponse } } },
      404: { description: 'Không tìm thấy', content: { 'application/json': { schema: errorResponse } } },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/custom-meals/{id}/photos/order',
    tags: [tag],
    summary: 'Sắp xếp lại thứ tự ảnh',
    operationId: 'reorderCustomMealPhotos',
    security,
    request: {
      params: customMealIdParamsSchema,
      body: { content: { 'application/json': { schema: reorderPhotosSchema } } },
    },
    responses: {
      ...successResponse(
        'Thứ tự ảnh đã được cập nhật',
        z.object({ success: z.literal(true), data: mealResponse }),
      ),
      401: { description: 'Chưa xác thực', content: { 'application/json': { schema: errorResponse } } },
      404: { description: 'Không tìm thấy', content: { 'application/json': { schema: errorResponse } } },
    },
  });
}
