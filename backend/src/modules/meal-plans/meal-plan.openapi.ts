import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  deleteMealPlanQuerySchema,
  deleteMealPlanResponseSchema,
  generateMealPlanRequestSchema,
  mealPlanItemParamsSchema,
  mealPlanListQuerySchema,
  mealPlanListResponseSchema,
  mealPlanParamsSchema,
  mealPlanResponseSchema,
  manualAddMealPlanItemRequestSchema,
  swapMealPlanItemRequestSchema,
} from './meal-plan.schemas.js';

const authenticated = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];
const errorResponse = (schema: ZodType, description: string, codes: string[]) => ({
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
const authErrors = (schema: ZodType) => ({
  401: errorResponse(schema, 'Yêu cầu access token hợp lệ', [
    'AUTH_REQUIRED',
    'INVALID_ACCESS_TOKEN',
    'TOKEN_EXPIRED',
  ]),
  403: errorResponse(schema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
});

export function registerMealPlanOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const generateRequest = registry.register(
    'GenerateMealPlanRequest',
    generateMealPlanRequestSchema,
  );
  const swapRequest = registry.register('SwapMealPlanItemRequest', swapMealPlanItemRequestSchema);
  const manualAddRequest = registry.register(
    'ManualAddMealPlanItemRequest',
    manualAddMealPlanItemRequestSchema,
  );
  const planResponse = registry.register('MealPlanResponse', mealPlanResponseSchema);
  const listResponse = registry.register('MealPlanListResponse', mealPlanListResponseSchema);
  const deleteResponse = registry.register('DeleteMealPlanResponse', deleteMealPlanResponseSchema);

  registry.registerPath({
    method: 'post',
    path: '/api/v1/meal-plans/generate',
    tags: ['Meal Plans'],
    summary: 'Tạo hoặc regenerate weekly meal plan',
    description:
      'Tạo Monday–Sunday, 3 bữa/ngày. MAINTAIN/LOSE/GAIN dùng TDEE × goal factor; protein, fiber, fat và carbohydrate là target ước tính từ cấu hình. Backend hard-filter trước scoring, ưu tiên tolerance nhưng vẫn dùng candidate hard-compatible ngoài tolerance. Chỉ UNFILLED khi không còn candidate hard-compatible và luôn trả unresolved reason. seed cho kết quả deterministic; supersedesMealPlanId liên kết version regenerate.',
    operationId: 'generateMealPlan',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: generateRequest,
            example: {
              weekStart: '2026-09-21',
              goal: 'MAINTAIN',
              idempotencyKey: 'plan-2026-09-21-maintain-01',
              seed: 'demo-week-39',
            },
          },
        },
      },
    },
    responses: {
      201: {
        description:
          'Thực đơn tuần mới cùng danh sách mua sắm, tóm tắt dễ hiểu và các lưu ý dành cho người dùng',
        content: { 'application/json': { schema: planResponse } },
      },
      400: errorResponse(errorSchema, 'Payload generate không hợp lệ', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      409: errorResponse(errorSchema, 'Profile, schedule, supersedes hoặc idempotency conflict', [
        'HEALTH_PROFILE_INCOMPLETE',
        'DIET_SCHEDULE_REQUIRED',
        'MEAL_PLAN_SUPERSEDES_INVALID',
        'MEAL_PLAN_IDEMPOTENCY_CONFLICT',
      ]),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/meal-plans',
    tags: ['Meal Plans'],
    summary: 'List meal plan versions của current user',
    operationId: 'listMealPlans',
    security: authenticated,
    request: { query: mealPlanListQuerySchema },
    responses: {
      200: {
        description: 'Meal plan summaries phân trang',
        content: { 'application/json': { schema: listResponse } },
      },
      400: errorResponse(errorSchema, 'Query list không hợp lệ', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/meal-plans/{id}',
    tags: ['Meal Plans'],
    summary: 'Đọc meal plan version thuộc current user',
    operationId: 'getMealPlan',
    security: authenticated,
    request: { params: mealPlanParamsSchema },
    responses: {
      200: {
        description:
          'Existing 21-item list plus additive Monday–Sunday day/slot view, explicit unresolved state, estimated four-macro targets/totals, shopping list and analysis',
        content: { 'application/json': { schema: planResponse } },
      },
      400: errorResponse(errorSchema, 'Meal plan ID không hợp lệ', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Không tìm thấy owned meal plan', ['NOT_FOUND']),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/meal-plans/{id}/items/{itemId}/swap',
    tags: ['Meal Plans'],
    summary: 'Swap một meal slot an toàn',
    description:
      'Chỉ chọn published eligible Recipe còn thỏa hard constraints của ngày. Ưu tiên calorie trong ±100 kcal so với món cũ; nếu không có dùng ±20% target và trả warning. expectedVersion chống concurrent update, idempotencyKey chống apply lặp.',
    operationId: 'swapMealPlanItem',
    security: authenticated,
    request: {
      params: mealPlanItemParamsSchema,
      body: {
        required: true,
        content: { 'application/json': { schema: swapRequest } },
      },
    },
    responses: {
      200: {
        description: 'Meal plan sau swap và shopping list đã tính lại',
        content: { 'application/json': { schema: planResponse } },
      },
      400: errorResponse(errorSchema, 'Payload swap không hợp lệ', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Không tìm thấy plan hoặc item thuộc user', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Không có candidate hoặc version/idempotency conflict', [
        'NO_ELIGIBLE_RECIPE',
        'MEAL_PLAN_VERSION_CONFLICT',
        'MEAL_PLAN_IDEMPOTENCY_CONFLICT',
      ]),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/meal-plans/{id}/items/{itemId}/manual-add',
    tags: ['Meal Plans'],
    summary: 'Thêm recipe hoặc private custom meal vào slot',
    description:
      'Hệ thống kiểm tra dị ứng, nguyên liệu cần tránh, chế độ ăn và quy tắc truyền thống trước khi lưu. Món phù hợp vẫn được lưu khi các chỉ số chất đạm, chất xơ, chất béo hoặc tinh bột ước tính lệch khỏi khoảng mục tiêu; các lưu ý này chỉ là gợi ý điều chỉnh và không chặn thao tác.',
    operationId: 'manualAddMealPlanItem',
    security: authenticated,
    request: {
      params: mealPlanItemParamsSchema,
      body: { required: true, content: { 'application/json': { schema: manualAddRequest } } },
    },
    responses: {
      200: {
        description: 'Meal plan và analysis đã cập nhật',
        content: { 'application/json': { schema: planResponse } },
      },
      400: errorResponse(errorSchema, 'Payload manual-add không hợp lệ', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Không tìm thấy owned plan, slot hoặc source', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Hard constraint, version hoặc idempotency conflict', [
        'MEAL_PLAN_HARD_CONSTRAINT_VIOLATION',
        'MEAL_PLAN_VERSION_CONFLICT',
        'MEAL_PLAN_IDEMPOTENCY_CONFLICT',
      ]),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/meal-plans/{id}',
    tags: ['Meal Plans'],
    summary: 'Soft-delete owned meal plan',
    operationId: 'deleteMealPlan',
    security: authenticated,
    request: { params: mealPlanParamsSchema, query: deleteMealPlanQuerySchema },
    responses: {
      200: {
        description: 'Delete idempotent; plan không còn xuất hiện trong list/detail',
        content: { 'application/json': { schema: deleteResponse } },
      },
      400: errorResponse(errorSchema, 'ID hoặc expectedVersion không hợp lệ', ['VALIDATION_ERROR']),
      ...authErrors(errorSchema),
      404: errorResponse(errorSchema, 'Không tìm thấy owned meal plan', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Meal plan version conflict', ['MEAL_PLAN_VERSION_CONFLICT']),
    },
  });
}
