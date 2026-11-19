import type { DietaryImpactService } from '../dietary-impact/dietary-impact.service.js';
import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import { getValidatedBody } from '../../common/validation/validate-request.js';
import {
  dietPreferenceResponseSchema,
  healthProfileResponseSchema,
  profileResponseSchema,
  type HealthProfileInput,
  type SaveDietPreferencesInput,
  type UpdateBasicProfileInput,
} from '../profile/profile.schemas.js';
import type { ProfileService } from '../profile/profile.service.js';

function authenticatedUserId(request: Request): string {
  if (request.auth) return request.auth.userId;
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
}

export class UsersController {
  constructor(
    private readonly service: ProfileService,
    private readonly impact: DietaryImpactService,
  ) {}

  getMe = async (request: Request, response: Response): Promise<void> => {
    const profile = await this.service.getProfile(authenticatedUserId(request));
    response
      .status(200)
      .json(profileResponseSchema.parse({ success: true, data: profile, meta: null }));
  };

  updateMe = async (request: Request, response: Response): Promise<void> => {
    const profile = await this.service.updateBasicProfile(
      authenticatedUserId(request),
      getValidatedBody<UpdateBasicProfileInput>(request),
    );
    response
      .status(200)
      .json(profileResponseSchema.parse({ success: true, data: profile, meta: null }));
  };

  updateHealthProfile = async (request: Request, response: Response): Promise<void> => {
    const healthProfile = await this.service.updateHealthProfile(
      authenticatedUserId(request),
      getValidatedBody<HealthProfileInput>(request),
    );
    response
      .status(200)
      .json(healthProfileResponseSchema.parse({ success: true, data: healthProfile, meta: null }));
  };

  saveDietPreferences = async (request: Request, response: Response): Promise<void> => {
    const preference = await this.service.saveDietPreferences(
      authenticatedUserId(request),
      getValidatedBody<SaveDietPreferencesInput>(request),
    );
    const impact = await this.impact.current(authenticatedUserId(request)).catch(() => null);
    response.status(200).json(
      dietPreferenceResponseSchema.parse({
        success: true,
        data: {
          ...preference,
          ...(impact ? { impact, impactUnavailable: false } : { impactUnavailable: true }),
        },
        meta: null,
      }),
    );
  };
}
