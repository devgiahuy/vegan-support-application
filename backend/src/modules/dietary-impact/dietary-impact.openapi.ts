import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import { saveDietPreferencesRequestSchema } from '../profile/profile.schemas.js';
import {
  mealProgramParamsSchema,
  mealProgramResponseSchema,
} from '../meal-programs/meal-program.schemas.js';
import {
  dietaryImpactResponseSchema,
  repairPreviewRequestSchema,
  repairApplyRequestSchema,
  repairPreviewResponseSchema,
  repairApplyResponseSchema,
  programRevisionRequestSchema,
} from './dietary-impact.schemas.js';

export function registerDietaryImpactOpenApi(registry: OpenAPIRegistry, error: ZodType) {
  const security = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];
  const entries = [
    {
      path: '/users/me/diet-preferences/impact-preview',
      id: 'previewDietaryImpact',
      summary: 'Xem ảnh hưởng của thiết lập dự kiến, chưa lưu',
      request: saveDietPreferencesRequestSchema,
      response: dietaryImpactResponseSchema,
    },
    {
      path: '/meal-plans/diet-repair/preview',
      id: 'previewDietaryRepair',
      summary: 'Tìm món thay thế và xem trước; không sửa thực đơn',
      request: repairPreviewRequestSchema,
      response: repairPreviewResponseSchema,
    },
    {
      path: '/meal-plans/diet-repair/apply',
      id: 'applyDietaryRepair',
      summary: 'Áp dụng phương án theo phiên bản; kết quả riêng từng thực đơn',
      request: repairApplyRequestSchema,
      response: repairApplyResponseSchema,
    },
    {
      path: '/meal-programs/{id}/diet-revision',
      id: 'createDietaryProgramRevision',
      summary: 'Tạo bản điều chỉnh nháp của chương trình đã xác nhận',
      request: programRevisionRequestSchema,
      response: mealProgramResponseSchema,
    },
  ];
  for (const entry of entries)
    registry.registerPath({
      method: 'post',
      path: '/api/v1' + entry.path,
      tags: ['Dietary Impact'],
      operationId: entry.id,
      summary: entry.summary,
      security,
      description:
        'Authenticated owner only. Four food allowances and allergies/exclusions are enforced server-side. Keeping a plan preserves its content, never overrides compatibility. Repair proposals expire after 15 minutes and validate dietary, plan and catalog revisions. Apply is idempotent and atomic per plan; a failed plan stays unchanged. Confirmed programs require a new draft revision.',
      request: {
        ...(entry.path.includes('{id}') ? { params: mealProgramParamsSchema } : {}),
        body: { required: true, content: { 'application/json': { schema: entry.request } } },
      },
      responses: {
        [entry.id === 'createDietaryProgramRevision' ? 201 : 200]: {
          description: 'Kết quả',
          content: { 'application/json': { schema: entry.response } },
        },
        400: {
          description:
            'VALIDATION_ERROR / INVALID_ALLERGEN_SELECTION / INVALID_INGREDIENT_ALLERGIES / INVALID_INGREDIENT_EXCLUSIONS',
          content: { 'application/json': { schema: error } },
        },
        401: { description: 'AUTH_REQUIRED', content: { 'application/json': { schema: error } } },
        403: { description: 'ACCOUNT_BANNED', content: { 'application/json': { schema: error } } },
        404: {
          description: 'NOT_FOUND: no owned plan/proposal/program',
          content: { 'application/json': { schema: error } },
        },
        409: {
          description:
            'DIET_REPAIR_CONFLICT / DIET_REPAIR_EXPIRED / IDEMPOTENCY_CONFLICT / DIET_PREFERENCES_CONFLICT / MEAL_PROGRAM_VERSION_CONFLICT / MEAL_PROGRAM_HISTORICAL / MEAL_PROGRAM_REVISION_NOT_REQUIRED',
          content: { 'application/json': { schema: error } },
        },
      },
    });
}
