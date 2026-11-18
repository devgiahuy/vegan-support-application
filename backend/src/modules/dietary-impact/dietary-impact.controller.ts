import type { Request, Response } from 'express';
import { Router } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  validateBody,
  validateParams,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import {
  saveDietPreferencesRequestSchema,
  type SaveDietPreferencesInput,
} from '../profile/profile.schemas.js';
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
  type RepairPreviewInput,
  type RepairApplyInput,
} from './dietary-impact.schemas.js';
import type { DietaryImpactService } from './dietary-impact.service.js';
import type { DietaryProgramRevisionService } from './dietary-program-revision.service.js';

const userId = (request: Request) => {
  if (!request.auth)
    throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập.' });
  return request.auth.userId;
};
export class DietaryImpactController {
  constructor(
    private readonly service: DietaryImpactService,
    private readonly revisions: DietaryProgramRevisionService,
  ) {}
  preview = async (request: Request, response: Response) => {
    response.json(
      dietaryImpactResponseSchema.parse({
        success: true,
        data: await this.service.preview(
          userId(request),
          getValidatedBody<SaveDietPreferencesInput>(request),
        ),
        meta: null,
      }),
    );
  };
  previewRepair = async (request: Request, response: Response) => {
    response.json(
      repairPreviewResponseSchema.parse({
        success: true,
        data: await this.service.previewRepair(
          userId(request),
          getValidatedBody<RepairPreviewInput>(request),
        ),
        meta: null,
      }),
    );
  };
  applyRepair = async (request: Request, response: Response) => {
    response.json(
      repairApplyResponseSchema.parse({
        success: true,
        data: await this.service.applyRepair(
          userId(request),
          getValidatedBody<RepairApplyInput>(request),
        ),
        meta: null,
      }),
    );
  };
  revise = async (request: Request, response: Response) => {
    const id = userId(request);
    const data = await this.revisions.create(
      id,
      getValidatedParams<{ id: string }>(request).id,
      getValidatedBody<{ expectedVersion: number; idempotencyKey: string }>(request),
    );
    response
      .status(201)
      .json(
        mealProgramResponseSchema.parse({
          success: true,
          data: { ...data, compatibility: await this.service.programCompatibility(id, data.id) },
          meta: null,
        }),
      );
  };
}
export function createDietaryImpactRouter(
  controller: DietaryImpactController,
  authentication: AuthenticationMiddleware,
) {
  const router = Router();
  router.post(
    '/users/me/diet-preferences/impact-preview',
    authentication.authenticate,
    validateBody(saveDietPreferencesRequestSchema),
    controller.preview,
  );
  router.post(
    '/meal-plans/diet-repair/preview',
    authentication.authenticate,
    validateBody(repairPreviewRequestSchema),
    controller.previewRepair,
  );
  router.post(
    '/meal-plans/diet-repair/apply',
    authentication.authenticate,
    validateBody(repairApplyRequestSchema),
    controller.applyRepair,
  );
  router.post(
    '/meal-programs/:id/diet-revision',
    authentication.authenticate,
    validateParams(mealProgramParamsSchema),
    validateBody(programRevisionRequestSchema),
    controller.revise,
  );
  return router;
}
